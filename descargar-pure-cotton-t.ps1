# Descarga las 15 imágenes/ muestras de color de Fruit of the Loom Pure Cotton T.
# Ejecutar desde la carpeta del repositorio IN TIME.
$ErrorActionPreference = "Stop"
$destino = Join-Path $PSScriptRoot "imagenes\fruit-of-the-loom\manga-corta\pure-cotton-t"
New-Item -ItemType Directory -Force -Path $destino | Out-Null

$imagenes = @(
    @{ Nombre = "01-White.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_000_f-2025_01.jpg" },
    @{ Nombre = "02-Natural.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_008_f-2025_01.jpg" },
    @{ Nombre = "03-Black.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_101_f-2025_01.jpg" },
    @{ Nombre = "04-Light-Graphite.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_135_f-2025_01.jpg" },
    @{ Nombre = "05-Deep-Navy.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_202_f-2025_01.jpg" },
    @{ Nombre = "06-Mountain-Blue.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_211_f-2025_01.jpg" },
    @{ Nombre = "07-Royal-Blue.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_300_f-2025_01.jpg" },
    @{ Nombre = "08-Ocean-Teal.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_312_f-2025_01.jpg" },
    @{ Nombre = "09-Mineral-Blue-muestra.jpg"; URL = "https://www.tuskamisetas.com/resources/Piktogramme/127_01_329.jpg" },
    @{ Nombre = "10-Dark-Plum.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_344_f-2025_01.jpg" },
    @{ Nombre = "11-Red.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_400_f-2025_01.jpg" },
    @{ Nombre = "12-Cranberry.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_428_f-2025_01.jpg" },
    @{ Nombre = "13-Sage-muestra.jpg"; URL = "https://www.tuskamisetas.com/resources/Piktogramme/127_01_532.jpg" },
    @{ Nombre = "14-Classic-Olive.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_533_f-2025_01.jpg" },
    @{ Nombre = "15-Desert-Sand.jpg"; URL = "https://www.tuskamisetas.com/resources/images/127_01_742_f-2025_01.jpg" }
)

foreach ($imagen in $imagenes) {
    $ruta = Join-Path $destino $imagen.Nombre
    Invoke-WebRequest -Uri $imagen.URL -OutFile $ruta
    Write-Host "Descargada: $($imagen.Nombre)"
}
Write-Host "Finalizado. Archivos guardados en: $destino"
