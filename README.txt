IN TIME - catálogo modular

index.html: estructura y funcionamiento de la web.
products.js: catálogo completo de productos (228).
assets/products/: fotografías extraídas de los datos de producto.

Para actualizar un producto en el futuro, modificar products.js. No es necesario reconstruir index.html. Mantener products.js en la misma carpeta que index.html y conservar assets/products/.

Marca Roly añadida en Camiseta Manga Larga con 2 productos del CSV y sus 4 imágenes por producto. Logotipo: assets/brands/roly-logo.svg.

ACTUALIZACION DEL CONFIGURADOR - CANTIDADES POR COLOR Y TALLA
- El color se elige desde los colores disponibles del producto.
- Para cada color se introducen cantidades independientes en S, M, L, XL, XXL y XXXL.
- El cliente pulsa "Guardar este color y añadir otro" para registrar ese desglose y elegir un nuevo color.
- Se pueden guardar varios colores, incluso con cantidades diferentes en una misma talla.
- El resumen conserva cada color y su desglose de tallas al añadir la configuración.
- Si se vuelve a guardar un color ya registrado, se actualiza su desglose en lugar de duplicarlo.
