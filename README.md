# 🛡️ AegisVault

> **Privacy-First Digital Vault with AI-Powered Security**

AegisVault is a production-grade, secure digital vault web application that combines **client-side encryption** with **on-device AI** capabilities powered by RunAnywhere SDK. Store passwords, documents, and notes with enterprise-level security while leveraging AI for password generation, security recommendations, and voice features.

---

## ✨ Features

### 🔐 **Core Security**
- **AES-256-GCM Encryption** - Military-grade client-side encryption
- **PBKDF2 Key Derivation** - Secure master password hashing (100,000 iterations)
- **Zero-Knowledge Architecture** - Server never sees your decryption keys
- **Auto-Lock Vault** - Automatic vault locking after 15 minutes of inactivity
- **SHA-256 Integrity Verification** - Document integrity checking

### 🧠 **AI-Powered Features** (RunAnywhere SDK)
- **AI Password Generator** - Generate strong, memorable passwords using on-device LLM
- **Smart Security Advisor** - Get personalized security recommendations from AI
- **Password Strength Analysis** - Real-time AI-powered password evaluation
- **Voice Features** (Coming Soon) - STT/TTS for voice commands and notes
- **Document Classification** (Coming Soon) - Automatic document type detection using VLM

### 🔑 **Password Vault**
- Add, edit, delete password entries
- AI-powered password generation
- Password strength checker
- Copy to clipboard
- Search and filtering
- Secure encrypted storage

### 📊 **Security Center**
- Vault health score visualization
- Weak password detection
- Security recommendations from AI
- Best practices guide
- Real-time security monitoring

### 📂 **DocVault** (Planned)
- Encrypted document storage
- Support for Aadhaar, PAN, certificates
- Expiry date tracking
- AI document classification
- Preview and download with decryption

### 📝 **Secure Notes** (Planned)
- Rich text encrypted notes
- Voice-to-text transcription
- Tag support
- Search functionality

---

## 🏗️ Architecture

AegisVault follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/                 # Business logic & entities
│   ├── entities/          # User, VaultItem, PasswordItem, etc.
│   ├── repositories/      # Repository interfaces
│   └── types/             # Domain type definitions
├── application/           # Use cases & services
│   └── services/          # AIService, VaultService, VoiceService
├── infrastructure/        # External integrations
│   ├── crypto/           # EncryptionService (AES-256-GCM)
│   ├── storage/          # LocalStorage, IndexedDB
│   └── api/              # Backend API client
└── presentation/          # UI layer
    ├── components/        # React components
    ├── contexts/          # React contexts (Auth, Vault)
    ├── pages/            # Page components
    └── hooks/            # Custom React hooks
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Modern browser (Chrome 96+, Edge 96+)
- 4GB+ RAM recommended for AI models

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd AegisVault

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### First Use

1. **Create Account**: Register with email and account password
2. **Set Master Password**: Create a strong master password for encryption (min 8 characters)
3. **Unlock Vault**: Use your master password to unlock and access your vault
4. **Load AI Models**: First time will download LLM models (~250MB) - they're cached for future use

---

## 🧠 RunAnywhere SDK Integration

AegisVault leverages the **RunAnywhere Web SDK** for on-device AI features:

### Models Used
- **LFM2 350M (LLM)**: Password generation, security advice (~250MB)
- **Whisper Tiny (STT)**: Voice transcription (~105MB) - Coming Soon
- **Piper TTS**: Text-to-speech (~65MB) - Coming Soon
- **Silero VAD**: Voice activity detection (~5MB) - Coming Soon
- **LFM2-VL 450M (VLM)**: Document classification (~500MB) - Coming Soon

### Privacy Benefits
- ✅ All AI inference runs **in your browser**
- ✅ No data sent to external servers
- ✅ Works offline after initial model download
- ✅ Models cached in browser storage (OPFS)

---

## 🔒 Security Architecture

### Encryption Flow

```
User Password
    ↓
PBKDF2 (100,000 iterations)
    ↓
Master Encryption Key (AES-256)
    ↓
Encrypt Data (AES-256-GCM)
    ↓
Store Encrypted Blob + IV + Auth Tag
```

### Key Security Features

1. **Client-Side Only**: Encryption keys never leave your browser
2. **Memory-Only Keys**: Keys stored in RAM, never persisted to disk
3. **Auto-Lock**: Vault locks on inactivity, logout, or tab close
4. **No Plain Text**: All sensitive data encrypted before storage
5. **Authenticated Encryption**: GCM mode provides integrity verification

---

## 🎨 UI/UX Design

- **Dark Theme**: Eye-friendly dark mode (light mode planned)
- **Glassmorphism**: Modern, translucent card design
- **Responsive**: Works on desktop, tablet, and mobile
- **Animations**: Smooth transitions with Framer Motion (planned)
- **Accessibility**: WCAG 2.1 compliant (in progress)

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Web Crypto API** - Browser-native encryption
- **RunAnywhere SDK** - On-device AI (LLM, STT, TTS, VAD, VLM)

### Backend (Planned)
- **Node.js + Express** - REST API
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

---

## 📖 Usage Examples

### AI Password Generation

```typescript
import { aiService } from './application/services/AIService';

// Generate strong password
const suggestion = await aiService.generatePassword({
  length: 16,
  memorable: true,
  includeSymbols: true
});

console.log(suggestion.password); // "Quantum$Tree9Moon!"
console.log(suggestion.strength.score); // 95
```

### Vault Operations

```typescript
import { vaultService } from './application/services/VaultService';

// Create password entry
await vaultService.createPassword(userId, {
  website: 'GitHub',
  username: 'user@example.com',
  password: 'Quantum$Tree9Moon!',
  url: 'https://github.com'
});

// Get decrypted password
const password = await vaultService.getPassword(passwordId);
console.log(password.data.password); // Decrypted password
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security
```

---

## 📦 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npx vercel --prod
```

The included `vercel.json` sets required Cross-Origin-Isolation headers for SharedArrayBuffer support.

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=https://your-api.com
VITE_ENABLE_DEBUG=false
```

---

## 🗺️ Roadmap

### Phase 1 - Core Features ✅
- [x] Authentication system
- [x] Encryption engine
- [x] Password vault
- [x] AI password generation
- [x] Security center

### Phase 2 - Enhanced Features (In Progress)
- [ ] DocVault with document upload
- [ ] Voice-based vault unlock
- [ ] Secure notes with voice transcription
- [ ] AI document classification (VLM)
- [ ] Activity logs

### Phase 3 - Advanced Features (Planned)
- [ ] Backend API with PostgreSQL
- [ ] Multi-device sync
- [ ] Encrypted backup/export
- [ ] Two-factor authentication
- [ ] Password sharing
- [ ] Browser extension

### Phase 4 - Enterprise Features (Future)
- [ ] Team vaults
- [ ] Role-based access control
- [ ] Audit logs
- [ ] SSO integration
- [ ] Hardware key support

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **RunAnywhere SDK** - On-device AI inference
- **llama.cpp** - LLM backend
- **sherpa-onnx** - STT/TTS/VAD backend
- **Liquid AI** - LFM2 models
- **OpenAI** - Whisper models

---

## 📞 Support

- 📧 Email: support@aegisvault.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/aegisvault/issues)
- 💬 Discord: [Join our community](https://discord.gg/aegisvault)

---

## ⚠️ Security Disclosure

If you discover a security vulnerability, please email security@aegisvault.com. Do not open public issues for security concerns.

---

**Built with ❤️ and 🔒 by [Your Name]**

*Making privacy-first security accessible to everyone*
