const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

exports.sendReminderNotifications = onSchedule({
    schedule: "every 1 minutes",
    timeZone: "Asia/Baku",
    region: "me-central2",
    maxInstances: 1
}, async () => {
    const now = Date.now();
    const nowTimestamp = admin.firestore.Timestamp.fromMillis(now);
    const lookAhead = admin.firestore.Timestamp.fromMillis(now + 10 * 60 * 1000);
    const snapshot = await db.collectionGroup("reminders")
        .where("at", ">", nowTimestamp)
        .where("at", "<=", lookAhead)
        .get();

    for (const reminderDoc of snapshot.docs) {
        const reminder = reminderDoc.data();
        const eventAt = reminder.at?.toMillis?.();
        if (!eventAt || !reminder.title) continue;

        const firstNoticeAt = eventAt - 10 * 60 * 1000;
        if (now < firstNoticeAt || now >= eventAt) continue;

        const slot = Math.min(4, Math.floor((now - firstNoticeAt) / (2 * 60 * 1000)));
        const userId = reminderDoc.ref.parent.parent?.id;
        if (!userId) continue;

        const tokensSnapshot = await db.collection("users").doc(userId).collection("tokens").get();
        const tokenDocs = tokensSnapshot.docs.filter(doc => doc.get("token"));
        if (!tokenDocs.length) continue;

        let reserved = false;
        await db.runTransaction(async transaction => {
            const latest = await transaction.get(reminderDoc.ref);
            if (!latest.exists) return;
            const lastSlot = Number(latest.get("lastNotifiedSlot") ?? -1);
            if (slot <= lastSlot) return;
            transaction.update(reminderDoc.ref, {
                lastNotifiedSlot: slot,
                lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            reserved = true;
        });
        if (!reserved) continue;

        const minutesLeft = 10 - slot * 2;
        const title = "Liman Anbarı · Xatırlatma";
        const body = `${minutesLeft} dəqiqə qalıb: ${reminder.title}`;
        const result = await messaging.sendEachForMulticast({
            tokens: tokenDocs.map(doc => doc.get("token")),
            data: {
                title,
                body,
                reminderId: reminderDoc.id,
                slot: String(slot),
                tag: `liman-reminder-${reminderDoc.id}-${slot}`
            },
            webpush: {
                headers: { Urgency: "high" },
                fcmOptions: { link: "https://karypsx.github.io/Liman-Anbari/" }
            }
        });

        const invalidTokenDeletes = [];
        result.responses.forEach((response, index) => {
            if (!response.success && [
                "messaging/registration-token-not-registered",
                "messaging/invalid-registration-token"
            ].includes(response.error?.code)) {
                invalidTokenDeletes.push(tokenDocs[index].ref.delete());
            }
        });
        if (invalidTokenDeletes.length) await Promise.all(invalidTokenDeletes);
        logger.info("Xatırlatma göndərildi", {
            userId,
            reminderId: reminderDoc.id,
            slot,
            successCount: result.successCount,
            failureCount: result.failureCount
        });
    }
});
