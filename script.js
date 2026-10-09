// Bura 1-ci addımda aldığın Google Sheets CSV linkini yapışdır
const googleSheetsCSVLink = "SƏNİN_GOOGLE_SHEETS_CSV_LİNKİN_BURAYA";

let anbarData = [];

// Səhifə açılanda Excel datalarını arxa planda yükləyirik
Papa.parse(googleSheetsCSVLink, {
    download: true,
    header: true, // Sütun adlarını (Malın Adı, Rəf və s.) açar kimi istifadə edir
    complete: function(results) {
        anbarData = results.data;
        console.log("Excel məlumatları yükləndi!", anbarData);
    }
});

// QR Kod oxunduğu zaman işləyəcək funksiya
function onScanSuccess(decodedText, decodedResult) {
    // Tutaq ki, QR kodun içində sadəcə "9" rəqəmi və ya "Ref 9" yazılıb
    // Axtarış üçün kodu təmizləyirik (məsələn ancaq "9" rəqəmini götürürük)
    let axtarilanRef = decodedText.trim(); 
    
    document.getElementById("ref-title").innerText = "Rəf: " + axtarilanRef;
    let listContainer = document.getElementById("product-list");
    listContainer.innerHTML = ""; // Köhnə nəticələri təmizlə

    // Bütün anbar datasını yoxlayır, Rəf sütunu oxunan QR koda bərabər olanları tapır
    // DİQQƏT: Exceldəki sütun adın "Rəf"dirsə bura da onu yazmalısan
    let tapilanMallar = anbarData.filter(mal => mal["Rəf"] == axtarilanRef);

    if(tapilanMallar.length > 0) {
        // Tapılan malları HTML-ə əlavə edirik
        tapilanMallar.forEach(mal => {
            let li = document.createElement("li");
            // Exceldəki başlıqlarına uyğun adları yaz. Məsələn: mal["Malın Adı"], mal["Say"]
            li.innerHTML = `<strong>${mal["Malın Adı"]}</strong> - Say: <span class="say">${mal["Say"]}</span>`;
            listContainer.appendChild(li);
        });
    } else {
        listContainer.innerHTML = "<p>Bu rəfdə heç bir mal tapılmadı.</p>";
    }
}

// Kameranı aktivləşdirmək (Arxa kameranı açır)
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", 
    { fps: 10, qrbox: {width: 250, height: 250} }, 
    false);
html5QrcodeScanner.render(onScanSuccess);