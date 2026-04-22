const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// ===== CONFIG =====
const ADMIN_EMAIL = 'vinhailo2025@gmail.com';
const ADMIN_PASS = '123456';
const JWT_SECRET = 'reup-automation-secret-key-2025';
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// ===== MULTER (upload) =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 9) + ext);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ===== AUTH with JWT =====
function generateToken(email) {
    return jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ===== DEFAULT DATA =====
function getDefaultData() {
    return {
        hero: {
            badge: "\ud83d\ude80 NHI\u1ec6M V\u1ee4 T\u00c2N TH\u1ee6",
            title: "H\u00c0NH TR\u00ccNH REUP\nAUTOMATION 30 NG\u00c0Y",
            subtitle: "Ch\u00e0o m\u1eebng b\u1ea1n \u0111\u1ebfn v\u1edbi h\u1ec7 th\u1ed1ng t\u1ef1 \u0111\u1ed9ng h\u00f3a",
            description: "Ch\u00fac m\u1eebng b\u1ea1n \u0111\u00e3 b\u1eaft \u0111\u1ea7u h\u00e0nh tr\u00ecnh ki\u1ebfm ti\u1ec1n v\u1edbi h\u1ec7 th\u1ed1ng t\u1ef1 \u0111\u1ed9ng h\u00f3a.\n\u0110\u00e2y kh\u00f4ng ph\u1ea3i kh\u00f3a h\u1ecdc \u2014 \u0111\u00e2y l\u00e0 h\u00e0nh tr\u00ecnh th\u1ef1c chi\u1ebfn.",
            highlight: "\ud83d\udc49 Ch\u1ec9 c\u1ea7n l\u00e0m \u0111\u00fang \u2013 l\u00e0m \u0111\u1ee7 \u2013 l\u00e0m \u0111\u1ec1u",
            ctaText: "\ud83d\ude80 B\u1eaeT \u0110\u1ea6U H\u00c0NH TR\u00ccNH"
        },
        video: {
            label: "\ud83c\udfac Video Gi\u1edbi Thi\u1ec7u",
            title: "Xem tr\u01b0\u1edbc to\u00e0n b\u1ed9 h\u00e0nh tr\u00ecnh",
            subtitle: "D\u00e0nh v\u00e0i ph\u00fat \u0111\u1ec3 hi\u1ec3u to\u00e0n b\u1ed9 h\u00e0nh tr\u00ecnh b\u1ea1n s\u1eafp \u0111i",
            url: "",
            placeholder: "VIDEO: GI\u1edaI THI\u1ec6U REUP AUTOMATION"
        },
        program: {
            enabled: true,
            toggleText: "\u0110I\u1ec0U KI\u1ec6N THAM GIA",
            bannerImage: "",
            iconImage: "",
            iconEmoji: "\ud83d\ude80",
            title: "H\u1ec7 th\u1ed1ng Reup Automation",
            subtitle: "Vinh h\u1ed7 tr\u1ee3 full tool (t\u1ea3i \u2192 edit \u2192 \u0111\u0103ng)",
            demoText: "Click xem demo video",
            videoUrl: "",
            workLabel: "\u2699\ufe0f Vi\u1ec7c c\u1ee7a b\u1ea1n",
            workBody: "5 page \u00d7 3 video/ng\u00e0y \u00d7 21 ng\u00e0y",
            workItems: ["5 page", "3 video/ng\u00e0y", "21 ng\u00e0y"],
            giftLabel: "\ud83c\udf81 B\u1ea1n nh\u1eadn \u0111\u01b0\u1ee3c",
            giftItems: ["Tool automation reup", "Quy tr\u00ecnh th\u1ef1c chi\u1ebfn", "Support + c\u1ed9ng \u0111\u1ed3ng"],
            tiers: [
                {
                    name: "Cam k\u1ebft 499K",
                    amount: "499",
                    unit: "K",
                    note: "Ho\u00e0n 100% khi ho\u00e0n th\u00e0nh",
                    features: ["Tool automation reup", "Quy tr\u00ecnh th\u1ef1c chi\u1ebfn", "Support + c\u1ed9ng \u0111\u1ed3ng"],
                    buttonText: "Cam k\u1ebft 499K",
                    qrImage: "",
                    confirmText: "\u0110\u00e3 chuy\u1ec3n kho\u1ea3n cam k\u1ebft",
                    confirmUrl: ""
                },
                {
                    name: "Cam k\u1ebft 799K",
                    amount: "799",
                    unit: "K",
                    note: "T\u1ea5t c\u1ea3 quy\u1ec1n l\u1ee3i + \u0111\u1ed3ng h\u00e0nh s\u00e2u h\u01a1n",
                    features: ["T\u1ea5t c\u1ea3 quy\u1ec1n l\u1ee3i", "\u0110\u01b0\u1ee3c h\u1ed7 tr\u1ee3 coach 1:1 h\u01b0\u1edbng d\u1eabn s\u1eed d\u1ee5ng tool", "T\u1eb7ng key", "C\u00e1c c\u00e2u h\u1ecfi li\u00ean quan \u0111\u1ebfn n\u1ed9i dung h\u00e0nh tr\u00ecnh"],
                    buttonText: "Cam k\u1ebft 799K",
                    qrImage: "",
                    confirmText: "\u0110\u00e3 chuy\u1ec3n kho\u1ea3n cam k\u1ebft",
                    confirmUrl: "",
                    featured: true
                }
            ],
            adminButtonText: "Th\u00f4ng tin admin h\u00e0nh tr\u00ecnh",
            adminBioUrl: "",
            highlight: "\ud83d\udd25 Kh\u00f4ng ph\u1ea3i kh\u00f3a h\u1ecdc \u2013 \u0110\u00e2y l\u00e0 h\u00e0nh tr\u00ecnh Affiliate th\u1ef1c chi\u1ebfn"
        },
        missions: [
            {
                icon: "\ud83e\udde9", title: "CH\u1eccN H\u01af\u1edaNG", subtitle: "Ch\u1ecdn ch\u1ee7 \u0111\u1ec1 & ngu\u1ed3n video",
                description: "X\u00e1c \u0111\u1ecbnh ch\u1ee7 \u0111\u1ec1 reup, lo\u1ea1i video b\u1ea1n mu\u1ed1n l\u00e0m, v\u00e0 s\u1ea3n ph\u1ea9m b\u1ea1n s\u1ebd g\u1eafn. \u0110\u00e2y l\u00e0 b\u01b0\u1edbc n\u1ec1n t\u1ea3ng quan tr\u1ecdng nh\u1ea5t.",
                color: "yellow", week: "w1",
                steps: ["Nghi\u00ean c\u1ee9u c\u00e1c ch\u1ee7 \u0111\u1ec1 \u0111ang hot tr\u00ean m\u1ea1ng x\u00e3 h\u1ed9i", "Ch\u1ecdn lo\u1ea1i video ph\u00f9 h\u1ee3p v\u1edbi s\u1ea3n ph\u1ea9m b\u1ea1n mu\u1ed1n qu\u1ea3ng b\u00e1", "X\u00e1c \u0111\u1ecbnh ngu\u1ed3n video ch\u1ea5t l\u01b0\u1ee3ng \u0111\u1ec3 reup"],
                videoTitle: "Ch\u1ecdn ngu\u1ed3n video Reup", videoSubtitle: "Video h\u01b0\u1edbng d\u1eabn chi ti\u1ebft", videoUrl: "",
                links: [], note: "", noteType: "info",
                checklist: ["\u0110\u00e3 xem video h\u01b0\u1edbng d\u1eabn", "\u0110\u00e3 ch\u1ecdn \u0111\u01b0\u1ee3c ch\u1ee7 \u0111\u1ec1 reup", "\u0110\u00e3 x\u00e1c \u0111\u1ecbnh s\u1ea3n ph\u1ea9m g\u1eafn k\u00e8m"],
                tip: "B\u1ea1n \u0111ang \u0111i \u0111\u00fang h\u01b0\u1edbng \u2014 \u0111\u00e2y l\u00e0 b\u01b0\u1edbc quan tr\u1ecdng nh\u1ea5t!"
            },
            {
                icon: "\ud83d\udcd8", title: "T\u1ea0O FANPAGE", subtitle: "T\u1ea1o h\u1ec7 th\u1ed1ng 5 Fanpage",
                description: "T\u1ea1o 5 Fanpage theo ch\u1ee7 \u0111\u1ec1 \u0111\u00e3 ch\u1ecdn. \u0110\u00e2y l\u00e0 n\u1ec1n t\u1ea3ng traffic ch\u00ednh. Sau khi t\u1ea1o xong, \u0111i\u1ec1n form th\u00f4ng tin \u0111\u1ec3 admin h\u1ed7 tr\u1ee3.",
                color: "purple", week: "w1",
                steps: ["T\u1ea1o 5 Fanpage v\u1edbi t\u00ean li\u00ean quan \u0111\u1ebfn ch\u1ee7 \u0111\u1ec1", "Thi\u1ebft l\u1eadp avatar, cover & m\u00f4 t\u1ea3 cho t\u1eebng page", "\u0110i\u1ec1n form th\u00f4ng tin g\u1eedi cho admin"],
                videoTitle: "H\u01b0\u1edbng d\u1eabn t\u1ea1o Fanpage", videoSubtitle: "C\u00e1ch t\u1ea1o \u0111\u00fang chu\u1ea9n", videoUrl: "",
                links: [{ text: "\ud83d\udcc4 \u0110I\u1ec0N FORM TH\u00d4NG TIN", url: "#", style: "primary" }],
                note: "", noteType: "info",
                checklist: ["\u0110\u00e3 t\u1ea1o 5 Fanpage", "\u0110\u00e3 \u0111i\u1ec1n form th\u00f4ng tin"],
                tip: "\u0110\u00e2y l\u00e0 n\u1ec1n t\u1ea3ng traffic \u2014 l\u00e0m k\u1ef9 b\u01b0\u1edbc n\u00e0y!"
            },
            {
                icon: "\ud83d\udcb0", title: "SHOPEE AFFILIATE", subtitle: "K\u00edch ho\u1ea1t ngu\u1ed3n thu nh\u1eadp",
                description: "T\u1ea1o t\u00e0i kho\u1ea3n Shopee Affiliate v\u00e0 li\u00ean k\u1ebft v\u1edbi Fanpage. Test t\u1eebng page \u0111\u1ec3 \u0111\u1ea3m b\u1ea3o ho\u1ea1t \u0111\u1ed9ng.",
                color: "green", week: "w1",
                steps: ["\u0110\u0103ng k\u00fd t\u00e0i kho\u1ea3n Shopee Affiliate", "Li\u00ean k\u1ebft v\u1edbi t\u1eebng Fanpage \u0111\u00e3 t\u1ea1o", "Test th\u1eed link affiliate tr\u00ean m\u1ed7i page"],
                videoTitle: "H\u01b0\u1edbng d\u1eabn Shopee Affiliate", videoSubtitle: "T\u1eeb \u0111\u0103ng k\u00fd \u0111\u1ebfn li\u00ean k\u1ebft", videoUrl: "",
                links: [], note: "", noteType: "info",
                checklist: ["\u0110\u00e3 t\u1ea1o t\u00e0i kho\u1ea3n Shopee Affiliate", "\u0110\u00e3 th\u1eed li\u00ean k\u1ebft Fanpage"],
                tip: "\u0110\u00e2y l\u00e0 ngu\u1ed3n ti\u1ec1n c\u1ee7a h\u1ec7 th\u1ed1ng \u2014 k\u00edch ho\u1ea1t ngay!"
            },
            {
                icon: "\ud83d\udd0d", title: "T\u00ccM S\u1ea2N PH\u1ea8M", subtitle: "T\u00ecm s\u1ea3n ph\u1ea9m d\u1ec5 ra \u0111\u01a1n",
                description: "T\u00ecm s\u1ea3n ph\u1ea9m hot, d\u1ec5 b\u00e1n b\u1eb1ng ph\u01b0\u01a1ng ph\u00e1p t\u00ecm ki\u1ebfm h\u00ecnh \u1ea3nh.",
                color: "cyan", week: "w1",
                steps: ["S\u1eed d\u1ee5ng c\u00f4ng c\u1ee5 t\u00ecm ki\u1ebfm b\u1eb1ng h\u00ecnh \u1ea3nh", "L\u1ecdc s\u1ea3n ph\u1ea9m c\u00f3 hoa h\u1ed3ng cao & d\u1ec5 b\u00e1n", "Ch\u1ecdn \u00edt nh\u1ea5t 3 s\u1ea3n ph\u1ea9m ti\u1ec1m n\u0103ng"],
                videoTitle: "T\u00ecm s\u1ea3n ph\u1ea9m b\u1eb1ng h\u00ecnh \u1ea3nh", videoSubtitle: "M\u1eb9o t\u00ecm s\u1ea3n ph\u1ea9m hot", videoUrl: "",
                links: [], note: "", noteType: "info",
                checklist: ["\u0110\u00e3 t\u00ecm \u0111\u01b0\u1ee3c \u00edt nh\u1ea5t 3 s\u1ea3n ph\u1ea9m"],
                tip: "Ch\u1ecdn \u0111\u00fang s\u1ea3n ph\u1ea9m = ki\u1ebfm ti\u1ec1n nhanh!"
            },
            {
                icon: "\u2699\ufe0f", title: "C\u00c0I GEMLOGIN", subtitle: "Setup n\u1ec1n t\u1ea3ng automation",
                description: "T\u1ea3i v\u00e0 c\u00e0i \u0111\u1eb7t Gemlogin \u2014 n\u1ec1n t\u1ea3ng ch\u1ea1y tool automation.",
                color: "orange", week: "w2",
                steps: ["T\u1ea3i Gemlogin t\u1eeb link ch\u00ednh th\u1ee9c", "\u0110\u0103ng k\u00fd t\u00e0i kho\u1ea3n b\u1eb1ng link ref", "\u0110\u0103ng nh\u1eadp v\u00e0 ki\u1ec3m tra giao di\u1ec7n"],
                videoTitle: "H\u01b0\u1edbng d\u1eabn c\u00e0i Gemlogin", videoSubtitle: "T\u1eeb A \u0111\u1ebfn Z", videoUrl: "",
                links: [{ text: "\ud83d\udce5 T\u1ea2I GEMLOGIN", url: "#", style: "primary" }, { text: "\ud83d\udd17 LINK REF \u0110\u0102NG K\u00dd", url: "#", style: "secondary" }],
                note: "", noteType: "info",
                checklist: ["\u0110\u00e3 t\u1ea3i v\u00e0 c\u00e0i \u0111\u1eb7t Gemlogin", "\u0110\u00e3 \u0111\u0103ng nh\u1eadp th\u00e0nh c\u00f4ng"],
                tip: "\u0110\u00e2y l\u00e0 n\u1ec1n t\u1ea3ng ch\u1ea1y tool \u2014 c\u00e0i \u0111\u00fang c\u00e1ch nh\u00e9!"
            },
            {
                icon: "\ud83e\udd16", title: "C\u00c0I TOOL", subtitle: "K\u00edch ho\u1ea1t Super Reup",
                description: "G\u1eedi mail Gemlogin + Ultra view cho admin. Li\u00ean h\u1ec7 Zalo Vinh \u0111\u1ec3 \u0111\u01b0\u1ee3c c\u00e0i tool Super Reup.",
                color: "purple", week: "w2",
                steps: ["Chu\u1ea9n b\u1ecb mail Gemlogin \u0111\u00e3 \u0111\u0103ng k\u00fd", "G\u1eedi th\u00f4ng tin cho admin qua Zalo", "Ch\u1edd admin add tool v\u00e0o t\u00e0i kho\u1ea3n"],
                videoTitle: "", videoSubtitle: "", videoUrl: "",
                links: [], note: "Ph\u1ea3i \u0111\u00fang mail \u0111\u00e3 \u0111\u0103ng k\u00fd", noteType: "warning",
                checklist: ["\u0110\u00e3 g\u1eedi th\u00f4ng tin cho admin", "\u0110\u00e3 \u0111\u01b0\u1ee3c add tool th\u00e0nh c\u00f4ng"],
                tip: "\u0110\u00e2y l\u00e0 b\u01b0\u1edbc unlock automation \u2014 \u0111\u1eebng b\u1ecf qua!"
            },
            {
                icon: "\ud83c\udfac", title: "CH\u1ea0Y TOOL", subtitle: "B\u1eaft \u0111\u1ea7u t\u1ea1o video \u0111\u1ea7u ti\u00ean",
                description: "B\u1eaft \u0111\u1ea7u ch\u1ea1y tool \u0111\u1ec3 t\u1ea1o video reup v\u00e0 \u0111\u0103ng b\u00e0i l\u00ean Fanpage.",
                color: "cyan", week: "w2",
                steps: ["M\u1edf tool Super Reup trong Gemlogin", "C\u1ea5u h\u00ecnh theo h\u01b0\u1edbng d\u1eabn video", "Ch\u1ea1y t\u1ea1o video \u0111\u1ea7u ti\u00ean & \u0111\u0103ng b\u00e0i"],
                videoTitle: "S\u1eed d\u1ee5ng Tool Super Reup", videoSubtitle: "H\u01b0\u1edbng d\u1eabn chi ti\u1ebft t\u1eebng b\u01b0\u1edbc", videoUrl: "",
                links: [], note: "", noteType: "info",
                checklist: ["\u0110\u00e3 ch\u1ea1y video \u0111\u1ea7u ti\u00ean"],
                tip: "B\u1eaft \u0111\u1ea7u c\u00f3 traffic \u2014 ch\u1ea1y ngay video \u0111\u1ea7u ti\u00ean!"
            },
            {
                icon: "\u2705", title: "CHECKLIST CU\u1ed0I", subtitle: "Ki\u1ec3m tra to\u00e0n b\u1ed9 h\u1ec7 th\u1ed1ng",
                description: "V\u00e0o nh\u00f3m b\u00ecnh ch\u1ecdn checklist \u0111\u1ec3 admin h\u1ed7 tr\u1ee3. \u0110\u1ea3m b\u1ea3o h\u1ec7 th\u1ed1ng ho\u1ea1t \u0111\u1ed9ng \u0111\u00fang.",
                color: "green", week: "w2",
                steps: ["V\u00e0o nh\u00f3m v\u00e0 b\u00ecnh ch\u1ecdn checklist", "Admin ki\u1ec3m tra h\u1ec7 th\u1ed1ng c\u1ee7a b\u1ea1n", "X\u00e1c nh\u1eadn m\u1ecdi th\u1ee9 ho\u1ea1t \u0111\u1ed9ng \u0111\u00fang"],
                videoTitle: "", videoSubtitle: "", videoUrl: "",
                links: [], note: "", noteType: "info",
                checklist: ["\u0110\u00e3 check checklist trong nh\u00f3m"],
                tip: "B\u1ea1n \u0111\u00e3 s\u1eb5n s\u00e0ng scale \u2014 ki\u1ec3m tra l\u1ea7n cu\u1ed1i!"
            }
        ],
        completion: {
            title: "Ch\u00fac m\u1eebng b\u1ea1n!",
            description: "B\u1ea1n \u0111\u00e3 ho\u00e0n th\u00e0nh H\u00e0nh Tr\u00ecnh Reup Automation 30 Ng\u00e0y",
            subtitle: "\ud83d\udc49 Gi\u1edd m\u1edbi l\u00e0 l\u00fac b\u1eaft \u0111\u1ea7u th\u1ef1c s\u1ef1!",
            items: [
                { icon: "\ud83d\ude80", title: "\u0110\u0103ng video", desc: "M\u1ed7i ng\u00e0y \u0111\u1ec1u \u0111\u1eb7n" },
                { icon: "\ud83e\uddea", title: "Test s\u1ea3n ph\u1ea9m", desc: "T\u00ecm s\u1ea3n ph\u1ea9m hot m\u1edbi" },
                { icon: "\ud83d\udcc8", title: "Scale 10x", desc: "Nh\u00e2n b\u1ea3n h\u1ec7 th\u1ed1ng" }
            ],
            ctaText: "\ud83d\udc49 V\u00c0O NH\u00d3M NGAY",
            ctaUrl: "#",
            footerText: "\u2728 Ch\u00fac b\u1ea1n ki\u1ebfm \u0111\u01b0\u1ee3c ti\u1ec1n th\u1eadt t\u1eeb h\u1ec7 th\u1ed1ng n\u00e0y!"
        },
        footer: {
            text: "Reup Automation System \u2014 H\u00e0nh tr\u00ecnh th\u1ef1c chi\u1ebfn 30 ng\u00e0y",
            links: [
                { text: "H\u1ed7 tr\u1ee3", url: "#" },
                { text: "Nh\u00f3m Zalo", url: "#" },
                { text: "H\u01b0\u1edbng d\u1eabn", url: "#" }
            ]
        }
    };
}

// ===== DATA HELPERS =====
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading data:', e.message);
    }
    const def = getDefaultData();
    saveData(def);
    return def;
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ===== ROUTES =====

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        const token = generateToken(email);
        return res.json({ success: true, token });
    }
    res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
});

// Check auth
app.get('/api/auth', authMiddleware, (req, res) => {
    res.json({ success: true });
});

// Get data (public - hide password)
app.get('/api/data', (req, res) => {
    const data = loadData();
    if (!data.settings) data.settings = { unlockPassword: '' };
    const publicData = JSON.parse(JSON.stringify(data));
    if (publicData.settings) {
        publicData.settings.hasPassword = !!(publicData.settings.unlockPassword);
        delete publicData.settings.unlockPassword;
    }
    res.json(publicData);
});

// Get full data for admin (protected - includes password)
app.get('/api/data-admin', authMiddleware, (req, res) => {
    const data = loadData();
    if (!data.settings) data.settings = { unlockPassword: '' };
    res.json(data);
});

// Verify unlock password (public)
app.post('/api/verify-password', (req, res) => {
    const { password } = req.body;
    const data = loadData();
    const correctPassword = data.settings && data.settings.unlockPassword;
    if (!correctPassword) {
        return res.json({ success: true });
    }
    if (password === correctPassword) {
        return res.json({ success: true });
    }
    res.json({ success: false, error: 'Sai mật khẩu' });
});

// Save data (protected)
app.post('/api/data', authMiddleware, (req, res) => {
    try {
        const data = req.body;
        saveData(data);
        res.json({ success: true, message: 'Data saved successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Upload image (protected)
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({
        success: true,
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename
    });
});

// Change password (protected)
app.post('/api/change-password', authMiddleware, (req, res) => {
    // In production, store hashed password in a DB
    res.json({ success: true, message: 'Password change not supported in file mode' });
});

// ===== START =====
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Init data.json if not exists
loadData();

app.listen(PORT, () => {
    console.log(`\n  🚀 Reup Automation CMS Server`);
    console.log(`  ────────────────────────────`);
    console.log(`  🌐 Website:  http://localhost:${PORT}`);
    console.log(`  🔧 Admin:    http://localhost:${PORT}/admin.html`);
    console.log(`  📡 API:      http://localhost:${PORT}/api/data`);
    console.log(`  ────────────────────────────\n`);
});
