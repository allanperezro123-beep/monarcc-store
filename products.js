// ==========================================================================
// MONARCC — Catálogo oficial
// 10 referencias reales · 50 unidades en inventario (suma del stock por color)
// Todas las fotos: modelo oficial, estudio limpio, sin marcas de agua.
// Las "vistas" del slide son encuadres de detalle sobre la misma foto
// (plano general → logo/pecho → textura), así nunca se mezclan prendas.
// ==========================================================================

(function () {
  const IMG = {
    bmw: 'media/generated_bmw_racing.jpg',
    oracleWhite: 'media/generated_redbull_white.jpg',
    oracleRed: 'media/generated_redbull_red.jpg',
    ktm: 'media/generated_ktm_racing.jpg',
    whiteZip: 'media/generated_white_hoodie.jpg',
    brooklyn: 'media/generated_brooklyn_mocha.jpg',
    varsity: 'media/generated_jpn10_black_hoodie.jpg',
    grey: 'media/product_grey_hoodie.jpg',
    puffer: 'media/product_black_puffer.jpg',
    cargo: 'media/product_cargo_joggers.jpg',
    vip: 'media/generated_vip_golden_jacket.jpg'
  };

  const SIZES = ['S', 'M', 'L', 'XL'];

  const products = [
    {
      id: 'p01',
      name: 'Chaqueta Motorsport Negra Franjas Azul/Rojo',
      category: 'Chaquetas',
      realPrice: 180000,
      price: 139900,
      sizes: SIZES,
      colors: [{ name: 'Negro', key: 'negro', hex: '#111111', img: IMG.bmw, stock: 7 }],
      main: { pos: '50% 30%', zoom: 1 },
      views: [
        { pos: '60% 37%', zoom: 2.6, label: 'Logo en pecho' },
        { pos: '52% 52%', zoom: 2.1, label: 'Franjas motorsport' },
        { pos: '70% 76%', zoom: 2.4, label: 'Puño y textura' }
      ],
      fabric: 'Algodón perchado 340 g/m² · Cremallera metálica',
      description: 'Cuello alto estructurado, franjas diagonales azul y rojo termoselladas y puños acanalados. Corte regular que se lleva igual con cargo o jean.'
    },
    {
      id: 'p02',
      name: 'Chaqueta Racing Oracle Edición Pista',
      category: 'Chaquetas',
      realPrice: 185000,
      price: 144900,
      sizes: SIZES,
      colors: [
        { name: 'Blanco', key: 'blanco', hex: '#F2F2F0', img: IMG.oracleWhite, stock: 4 },
        { name: 'Rojo Racing', key: 'rojo', hex: '#D7182A', img: IMG.oracleRed, stock: 3 }
      ],
      main: { pos: '50% 28%', zoom: 1.25 },
      views: [
        { pos: '56% 30%', zoom: 2.6, label: 'Panel pectoral' },
        { pos: '44% 30%', zoom: 2.8, label: 'Bordados' },
        { pos: '50% 22%', zoom: 2.2, label: 'Cuello alto' }
      ],
      fabric: 'Algodón perchado 320 g/m² · Bordado de alta densidad',
      description: 'Silueta de paddock con cuello semialto y bloque de color en el pecho. Disponible en blanco y rojo racing: cambia el color para ver la prenda.'
    },
    {
      id: 'p03',
      name: 'Chaqueta Negra KTM Racing Team',
      category: 'Chaquetas',
      realPrice: 190000,
      price: 149900,
      sizes: SIZES,
      colors: [{ name: 'Negro', key: 'negro', hex: '#111111', img: IMG.ktm, stock: 4 }],
      main: { pos: '50% 30%', zoom: 1 },
      views: [
        { pos: '61% 44%', zoom: 2.7, label: 'Parche Racing Team' },
        { pos: '48% 30%', zoom: 2.2, label: 'Cuello y cierre' },
        { pos: '35% 70%', zoom: 2.4, label: 'Textura del perchado' }
      ],
      fabric: 'Algodón perchado grueso · Parche termosellado',
      description: 'Chaqueta motorsport con parche oficial en el pecho, cuello estructurado y cremallera oculta. Pensada para el uso diario y la moto.'
    },
    {
      id: 'p04',
      name: 'Hoodie Blanco Urbano con Cremallera',
      category: 'Hoodies',
      realPrice: 165000,
      price: 129900,
      sizes: SIZES,
      colors: [{ name: 'Blanco', key: 'blanco', hex: '#F2F2F0', img: IMG.whiteZip, stock: 6 }],
      main: { pos: '50% 30%', zoom: 1 },
      views: [
        { pos: '50% 34%', zoom: 2.2, label: 'Capota y cierre' },
        { pos: '42% 64%', zoom: 2.5, label: 'Bolsillo canguro' },
        { pos: '66% 52%', zoom: 2.8, label: 'Algodón 320 g' }
      ],
      fabric: 'Algodón perchado peinado 320 g/m²',
      description: 'Hombro caído, capota estructurada de doble capa y cremallera metálica. Un básico limpio y pesado.'
    },
    {
      id: 'p05',
      name: 'Conjunto Sudadera Brooklyn 1898 Moca',
      category: 'Conjuntos',
      realPrice: 220000,
      price: 174900,
      sizes: SIZES,
      colors: [{ name: 'Moca', key: 'moca', hex: '#7A543E', img: IMG.brooklyn, stock: 5 }],
      main: { pos: '50% 30%', zoom: 1 },
      views: [
        { pos: '51% 47%', zoom: 2.3, label: 'Bordado en relieve' },
        { pos: '48% 30%', zoom: 2.4, label: 'Capota' },
        { pos: '45% 86%', zoom: 2.2, label: 'Jogger a juego' }
      ],
      fabric: 'Algodón perchado 400 g/m² · Hoodie + jogger',
      description: 'Conjunto completo tono moca con tipografía BROOKLYN 1898 bordada tono sobre tono. Caída pesada, interior cepillado.'
    },
    {
      id: 'p06',
      name: 'Hoodie Negro Varsity con Cremallera',
      category: 'Hoodies',
      realPrice: 160000,
      price: 124900,
      sizes: SIZES,
      colors: [{ name: 'Negro', key: 'negro', hex: '#111111', img: IMG.varsity, stock: 6 }],
      main: { pos: '50% 30%', zoom: 1 },
      views: [
        { pos: '40% 46%', zoom: 2.6, label: 'Bordado azul' },
        { pos: '64% 44%', zoom: 2.8, label: 'Número en toalla' },
        { pos: '50% 33%', zoom: 2.2, label: 'Capota y cierre' }
      ],
      fabric: 'Algodón perchado 360 g/m² · Bordado en toalla',
      description: 'Zip hoodie oversize con letras varsity bordadas en azul motorsport y número en rojo racing.'
    },
    {
      id: 'p07',
      name: 'Hoodie Heavyweight Gris Jaspe',
      category: 'Hoodies',
      realPrice: 150000,
      price: 119900,
      sizes: SIZES,
      colors: [{ name: 'Gris', key: 'gris', hex: '#9A9A9E', img: IMG.grey, stock: 4 }],
      main: { pos: '50% 30%', zoom: 1 },
      views: [
        { pos: '52% 33%', zoom: 2.3, label: 'Capota doble' },
        { pos: '50% 70%', zoom: 2.3, label: 'Bolsillo canguro' },
        { pos: '28% 80%', zoom: 2.8, label: 'Puño acanalado' }
      ],
      fabric: 'Algodón perchado 380 g/m²',
      description: 'Pullover sin gráficos, silueta boxy y hombro caído. El hoodie que combina con todo.'
    },
    {
      id: 'p08',
      name: 'Chaqueta Puffer Negra Mate',
      category: 'Chaquetas',
      realPrice: 210000,
      price: 164900,
      sizes: ['M', 'L', 'XL'],
      colors: [{ name: 'Negro', key: 'negro', hex: '#111111', img: IMG.puffer, stock: 3 }],
      main: { pos: '50% 30%', zoom: 1 },
      views: [
        { pos: '50% 30%', zoom: 2.3, label: 'Cuello alto' },
        { pos: '40% 60%', zoom: 2.5, label: 'Acolchado' },
        { pos: '78% 85%', zoom: 2.8, label: 'Puño elástico' }
      ],
      fabric: 'Nylon mate repelente al agua · Relleno térmico',
      description: 'Acolchado horizontal de alta retención térmica, cuello alto contra el frío de la sabana y cremallera de dos vías.'
    },
    {
      id: 'p09',
      name: 'Camiseta Boxy Heavyweight Negra',
      category: 'Camisetas',
      realPrice: 85000,
      price: 64900,
      sizes: SIZES,
      colors: [{ name: 'Negro', key: 'negro', hex: '#111111', img: IMG.cargo, stock: 5 }],
      main: { pos: '50% 26%', zoom: 1.6 },
      views: [
        { pos: '52% 23%', zoom: 2.8, label: 'Cuello acanalado' },
        { pos: '64% 34%', zoom: 3, label: 'Manga drop' },
        { pos: '50% 40%', zoom: 1, label: 'Outfit completo' }
      ],
      fabric: '100% algodón peinado 240 g/m²',
      description: 'Corte boxy de sisa amplia y cuello grueso de 3 cm. No transparenta y no pierde forma al lavar.'
    },
    {
      id: 'p10',
      name: 'Sudadera Cargo Jogger Negra',
      category: 'Sudaderas',
      realPrice: 145000,
      price: 109900,
      sizes: SIZES,
      colors: [{ name: 'Negro', key: 'negro', hex: '#111111', img: IMG.cargo, stock: 3 }],
      main: { pos: '50% 72%', zoom: 1.7 },
      views: [
        { pos: '60% 63%', zoom: 2.8, label: 'Bolsillo cargo' },
        { pos: '50% 86%', zoom: 2.6, label: 'Puño resortado' },
        { pos: '50% 40%', zoom: 1, label: 'Outfit completo' }
      ],
      fabric: 'Algodón perchado 320 g/m² · 6 bolsillos',
      description: 'Jogger cargo con pretina elástica, cordón con punteras metálicas y bota resortada.'
    }
  ];

  const vip = {
    id: 'vip',
    isVip: true,
    name: 'Chaqueta Monarca Golden Crown',
    category: 'Exclusivo VIP',
    realPrice: 320000,
    price: 219900,
    sizes: SIZES,
    colors: [{ name: 'Negro / Oro', key: 'negro', hex: '#C9A96E', img: IMG.vip, stock: 1 }],
    main: { pos: '50% 30%', zoom: 1 },
    views: [
      { pos: '55% 52%', zoom: 2.2, label: 'Corona bordada en oro' },
      { pos: '50% 33%', zoom: 2.4, label: 'Cuello Monarca' }
    ],
    fabric: 'Algodón perchado pesado · Bordado en hilo oro champagne',
    description: 'Pieza secreta del círculo interno: corona monumental bordada en oro champagne y vivos rojo racing. Una sola unidad.'
  };

  const reviews = [
    { name: 'Sebastián R.', city: 'Bogotá', size: 'L', item: 'Chaqueta Motorsport Negra', text: 'El perchado es pesadísimo, nada que envidiarle a marcas gringas. Llegó al día siguiente con Inter Rapidísimo.' },
    { name: 'Camilo M.', city: 'Medellín', size: 'M', item: 'Conjunto Brooklyn Moca', text: 'El color es idéntico a las fotos. El corte con hombro caído queda brutal con tenis. 10/10.' },
    { name: 'Andrés F.', city: 'Soacha', size: 'XL', item: 'Chaqueta Racing Oracle', text: 'Orgullo ver prendas de este nivel hechas en Soacha. El cuello no se dobla y la cremallera es suavecita.' },
    { name: 'Daniel V.', city: 'Cali', size: 'L', item: 'Hoodie Blanco con Cremallera', text: 'Abriga full y no motosea después de varias lavadas. Pagué con tarjeta y rastreé todo con la guía.' }
  ];

  // Tarifas de envío Inter Rapidísimo (referencia del prototipo)
  const shipping = {
    freeFrom: 300000,
    zones: {
      local: { label: 'Local (Soacha / Bogotá)', cost: 8900, days: '1–2 días hábiles' },
      regional: { label: 'Regional (Cundinamarca)', cost: 12900, days: '2–3 días hábiles' },
      national: { label: 'Nacional', cost: 18900, days: '3–5 días hábiles' },
      remote: { label: 'Zona especial', cost: 29900, days: '5–8 días hábiles' }
    },
    departments: {
      'Cundinamarca': ['Soacha', 'Sibaté', 'Fusagasugá', 'Zipaquirá', 'Chía', 'Facatativá', 'Mosquera', 'Madrid'],
      'Bogotá D.C.': ['Bogotá'],
      'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro'],
      'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá'],
      'Atlántico': ['Barranquilla', 'Soledad', 'Malambo'],
      'Santander': ['Bucaramanga', 'Floridablanca', 'Girón'],
      'Bolívar': ['Cartagena', 'Magangué'],
      'Boyacá': ['Tunja', 'Duitama', 'Sogamoso'],
      'Tolima': ['Ibagué', 'Espinal'],
      'Meta': ['Villavicencio', 'Acacías'],
      'Nariño': ['Pasto', 'Ipiales'],
      'Amazonas': ['Leticia'],
      'San Andrés': ['San Andrés']
    }
  };

  window.MONARCC = { products, vip, reviews, shipping };
})();
