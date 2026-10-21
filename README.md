# Stock Desk v1
Simple warehouse inventory PWA: Home dashboard, Scan (camera QR/barcode → In/Out), Products (with printable QR labels), Containers (freight+duty → landed cost by value), Sales (by retailer + history). Data in IndexedDB on-device; CSV export on Home.

    npm run dev | npm test | npm run build | npm run screens | npm run zip
Camera scanning requires HTTPS (Netlify provides it). Deploy: drag ../stock-desk-deploy-v1.zip into Netlify.
