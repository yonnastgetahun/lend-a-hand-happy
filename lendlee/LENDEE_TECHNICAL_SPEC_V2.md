# Lendlee Technical Specification
## Version 2.0 - Decentralized Community Network

---

## 1. System Architecture Overview

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Web App   │  │  iOS App    │  │  Android    │           │
│  │   (React)   │  │ (Expo/RN)   │  │  (Expo/RN)  │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
└─────────┼───────────────┼───────────────┼────────────────────┘
          │               │               │
          ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STATE LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Zustand Stores                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │   Auth   │  │  Items   │  │ Messages │  │   Mesh   │  │   │
│  │  │  Store   │  │  Store   │  │  Store   │  │  Store   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │               │               │
          ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TRANSPORT LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   External   │  │    Nostr     │  │   Bluetooth  │         │
│  │   Share      │  │   Protocol   │  │  Mesh Layer  │         │
│  │  (Native)    │  │  (Internet)  │  │  (Offline)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
          │               │               │
          ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Local Storage (IndexedDB/SQLite)          │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │   │
│  │  │ Items  │  │ Keys   │  │ Messages│  │ Peers  │         │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Nostr Relays (External)                │   │
│  │           [relay 1] [relay 2] [relay 3] ...              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Web Application
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | Latest |
| State Management | Zustand | 4.x |
| Routing | React Router DOM | 6.x |
| Animations | Framer Motion | 11.x |
| Validation | Zod | 3.x |
| HTTP Client | TanStack Query | 5.x |

### 2.2 Mobile Application
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Expo SDK | 52.x |
| Language | TypeScript | 5.x |
| Runtime | React Native | 0.76.x |
| Navigation | Expo Router | 4.x |
| State Management | Zustand | 4.x |
| Local Storage | AsyncStorage | Latest |
| Animations | Reanimated | 3.x |

### 2.3 Decentralized Layer
| Component | Technology | Purpose |
|-----------|------------|---------|
| Identity | Nostr (NIP-26) | Decentralized keys |
| Messaging | Nostr (NIP-17) | Encrypted DMs |
| Encryption | Bls12-381 | Key generation |
| Mesh | react-native-ble-manager | Bluetooth LE |
| Compression | LZ4 | Message compression |

---

## 3. Data Models

### 3.1 Core Entities

```typescript
// User/Identity
interface User {
  id: string;                    // UUID (local only)
  nostrPublicKey: string;         // npub1... (generated)
  nostrPrivateKey: string;       // nsec1... (stored locally, never exported)
  displayName?: string;           // Optional
  createdAt: number;             // Unix timestamp
  lastActive: number;             // Unix timestamp
}

// Item (Give/Lend/Promote)
interface Item {
  id: string;                     // UUID
  type: 'give' | 'lend' | 'promote';
  title: string;
  description?: string;
  category: string;               // book, tool, gear, food, knowledge, event, other
  images: string[];               // Base64 or local URIs
  ownerId: string;               // User ID
  status: 'available' | 'pending' | 'completed' | 'archived';
  recipientId?: string;          // Who it's for
  createdAt: number;
  updatedAt: number;
}

// Transaction (The share event)
interface Transaction {
  id: string;
  itemId: string;
  fromUserId: string;
  toUserId?: string;             // Optional - can be "community"
  type: 'give' | 'lend' | 'promote';
  message?: string;             // Personal note
  reminderDate?: number;        // For lends
  completedAt?: number;
  createdAt: number;
}

// Neighbor (People you've interacted with)
interface Neighbor {
  id: string;
  nostrPublicKey: string;
  displayName?: string;
  trustScore: number;            // 0-100 based on interactions
  lastInteraction: number;
  isMeshConnected: boolean;      // Has been nearby via BLE
}

// Message (Decentralized)
interface Message {
  id: string;
  senderPubkey: string;
  receiverPubkey: string;
  content: string;              // Encrypted
  timestamp: number;
  delivered: boolean;
  transport: 'nostr' | 'mesh' | 'queued';
}

// Mesh Peer (Discovered via Bluetooth)
interface MeshPeer {
  id: string;
  publicKey: string;
  name?: string;
  lastSeen: number;
  rssi: number;                  // Signal strength
  isActive: boolean;
}
```

### 3.2 Database Schema (SQLite/IndexedDB)

```sql
-- Users (local only)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nostr_public_key TEXT NOT NULL,
  nostr_private_key TEXT NOT NULL,
  display_name TEXT,
  created_at INTEGER NOT NULL,
  last_active INTEGER NOT NULL
);

-- Items
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('give', 'lend', 'promote')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  images TEXT,                  -- JSON array
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  recipient_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT,
  type TEXT NOT NULL,
  message TEXT,
  reminder_date INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id)
);

-- Neighbors
CREATE TABLE neighbors (
  id TEXT PRIMARY KEY,
  nostr_public_key TEXT NOT NULL UNIQUE,
  display_name TEXT,
  trust_score INTEGER DEFAULT 0,
  last_interaction INTEGER NOT NULL,
  is_mesh_connected INTEGER DEFAULT 0
);

-- Messages (local cache)
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  sender_pubkey TEXT NOT NULL,
  receiver_pubkey TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  delivered INTEGER DEFAULT 0,
  transport TEXT DEFAULT 'nostr'
);

-- Mesh Peers
CREATE TABLE mesh_peers (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL UNIQUE,
  name TEXT,
  last_seen INTEGER NOT NULL,
  rssi INTEGER,
  is_active INTEGER DEFAULT 0
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## 4. API Specifications

### 4.1 Internal API (No Central Server)

Since we use Nostr for internet communication, there is no central API. Instead:

| Action | Method | Nostr Kind |
|--------|--------|-------------|
| Post Item | Publish to relay | 30001 (structured note) |
| Send Message | DM via NIP-17 | 4 (encrypted DM) |
| Get Messages | Subscribe to DMs | 4 |
| Update Profile | Kind 0 | 0 |

### 4.2 Relay Configuration

```typescript
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://eden.nostr.land',
  'wss://relay.shitdev.io',
];

// Custom relay list can be added in settings
```

### 4.3 External Share Interface

```typescript
interface ShareIntent {
  title: string;
  text: string;                  // Pre-formatted message
  url?: string;                  // Deep link back to item
}

// Example pre-formatted message:
const formatShareMessage = (item: Item, type: 'give' | 'lend' | 'promote') => {
  const prefix = type === 'give' ? '🎁 FREE' : type === 'lend' ? '🔄 LEND' : '📢';
  return `${prefix}: ${item.title}

${item.description || ''}

Shared via Lendlee - Build neighborhood resilience
${getDeepLink(item.id)}`;
};
```

---

## 5. Component Architecture

### 5.1 Web Components

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Problem.tsx
│   │   ├── Solution.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── ThreeWays.tsx
│   │   ├── NetworkEffect.tsx
│   │   ├── Technology.tsx
│   │   ├── EmergencyReady.tsx
│   │   ├── Values.tsx
│   │   ├── Story.tsx
│   │   └── CTASection.tsx
│   ├── sharing/
│   │   ├── ItemCard.tsx
│   │   ├── ItemForm.tsx
│   │   ├── TypeSelector.tsx
│   │   └── ShareButton.tsx
│   ├── messaging/
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── NeighborList.tsx
│   └── ui/                     (shadcn components)
├── pages/
│   ├── Index.tsx              (Landing)
│   ├── Dashboard.tsx
│   ├── AddItem.tsx
│   ├── SelectContact.tsx
│   ├── SetReminder.tsx
│   ├── Messages.tsx
│   ├── Neighbors.tsx
│   ├── Settings.tsx
│   └── Login.tsx / Register.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useItems.ts
│   ├── useNostr.ts
│   ├── useSharing.ts
│   └── useMeshNetwork.ts
├── stores/
│   ├── authStore.ts
│   ├── itemStore.ts
│   ├── messageStore.ts
│   └── meshStore.ts
├── lib/
│   ├── nostr.ts               (Nostr utilities)
│   ├── crypto.ts             (Encryption)
│   ├── ble.ts                (Bluetooth mesh)
│   └── share.ts              (External sharing)
└── types/
    └── index.ts
```

### 5.2 Mobile Components (Expo)

```
src/
├── app/                        (Expo Router file-based routing)
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx         (Home/Dashboard)
│   │   ├── items.tsx
│   │   ├── messages.tsx
│   │   └── settings.tsx
│   ├── add-item.tsx
│   ├── select-contact.tsx
│   ├── set-reminder.tsx
│   ├── item/[id].tsx
│   └── emergency.tsx
├── components/
│   ├── ItemCard.tsx
│   ├── ItemForm.tsx
│   ├── ShareSheet.tsx
│   ├── MeshStatus.tsx
│   └── EmergencyButton.tsx
├── stores/
│   ├── authStore.ts
│   ├── itemStore.ts
│   ├── nostrStore.ts
│   └── meshStore.ts
├── services/
│   ├── NostrService.ts
│   ├── BleService.ts
│   ├── EncryptionService.ts
│   └── ShareService.ts
├── hooks/
│   ├── useNostr.ts
│   ├── useBluetooth.ts
│   └── useShareIntent.ts
└── lib/
    ├── theme.ts
    ├── constants.ts
    └── utils.ts
```

---

## 6. Feature Specifications

### 6.1 Authentication (Phase 1)

**Flow:**
1. User opens app
2. App generates Nostr keypair (nsec/npub)
3. Keys stored locally in encrypted storage
4. Optional: Set display name
5. Start using app

```typescript
// Key generation
import { generatePrivateKey, getPublicKey } from 'nostr-tools';

const privateKey = generatePrivateKey();
const publicKey = getPublicKey(privateKey);
```

### 6.2 Give/Lend/Promote (Phase 1)

```typescript
interface CreateItemInput {
  type: 'give' | 'lend' | 'promote';
  title: string;
  description?: string;
  category: string;
  images?: string[];
}

// On save:
const item = {
  ...input,
  id: uuid(),
  ownerId: user.id,
  status: 'available',
  createdAt: Date.now(),
};

// Publish to Nostr (optional, for discovery)
await publishToRelays({
  kind: 30001,
  content: JSON.stringify(item),
  tags: [['t', item.category], ['type', item.type]]
});
```

### 6.3 Share Functionality (Phase 1)

```typescript
// React Native
import { Share } from 'react-native';

const shareItem = async (item: Item) => {
  const message = formatShareMessage(item);
  
  await Share.share({
    message,
    title: item.title,
  });
};

// Web
const shareWeb = async (item: Item) => {
  if (navigator.share) {
    await navigator.share({
      title: item.title,
      text: formatShareMessage(item),
    });
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(formatShareMessage(item));
  }
};
```

### 6.4 Nostr Messaging (Phase 2)

```typescript
// Send encrypted DM (NIP-17)
import { encrypt, getPublicKey } from 'nostr-tools';

const sendMessage = async (recipientPubkey: string, content: string) => {
  const encrypted = encrypt(content, privateKey, recipientPubkey);
  
  const event = {
    kind: 4,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', recipientPubkey]],
    content: encrypted,
  };
  
  // Sign and publish
  const signed = await signEvent(event);
  await publishToRelays(signed);
};

// Receive DMs
const subscribeToMessages = (callback: (msg: NostrEvent) => void) => {
  const subscription = relayPool.subscribe(
    [{ kinds: [4], authors: [myPubkey] }],
    callback
  );
  
  return () => subscription.close();
};
```

### 6.5 Bluetooth Mesh (Phase 3)

```typescript
// Peer discovery
import { BleManager, Device } from 'react-native-ble-manager';

class MeshNetwork {
  private manager: BleManager;
  private peers: Map<string, MeshPeer> = new Map();
  
  async startScanning() {
    await this.manager.startScanWithOptions(
      ['LENDLEE_MESH'],  // Service UUID
      { scanMatchMode: 3 }  // Match mode
    );
  }
  
  // Broadcast presence
  async broadcastPresence() {
    const data = JSON.stringify({
      pubkey: myPubkey,
      name: displayName,
      timestamp: Date.now(),
    });
    
    await this.manager.write(
      deviceId,
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      base64Encode(data)
    );
  }
  
  // Relay message through mesh
  async relayMessage(message: MeshMessage, hops: number = 0) {
    if (hops >= 7) return;  // Max hops
    
    // Forward to all connected peers
    for (const peer of this.peers.values()) {
      await this.sendToPeer(peer, message);
    }
  }
}
```

### 6.6 Emergency Mode (Phase 4)

```typescript
interface EmergencyBroadcast {
  type: 'alert' | 'request' | 'offer';
  message: string;
  location?: Geohash;
  timestamp: number;
  authorPubkey: string;
}

const triggerEmergency = async (type: EmergencyBroadcast['type'], message: string) => {
  const broadcast: EmergencyBroadcast = {
    type,
    message,
    location: getCurrentGeohash(),
    timestamp: Date.now(),
    authorPubkey: myPubkey,
  };
  
  // Send via all available transports
  await Promise.all([
    // Nostr
    publishEmergencyNostr(broadcast),
    // Bluetooth Mesh
    broadcastMeshEmergency(broadcast),
    // Queue for later
    queueOfflineBroadcast(broadcast),
  ]);
};
```

---

## 7. Security Specifications

### 7.1 Key Storage

```typescript
// iOS Keychain (via expo-secure-store)
import * as SecureStore from 'expo-secure-store';

const storeKeys = async (privateKey: string, publicKey: string) => {
  await SecureStore.setItemAsync('nostr_private_key', privateKey);
  await SecureStore.setItemAsync('nostr_public_key', publicKey);
};

// Web - IndexedDB with encryption
import { encrypt, decrypt } from 'crypto-js';

const storeKeysWeb = async (keys: KeyPair) => {
  const encrypted = encrypt(keys.privateKey, getDeviceSecret());
  await db.put('keys', { pubkey: keys.publicKey, encrypted });
};
```

### 7.2 Emergency Wipe

```typescript
// Triple-tap detection
let tapCount = 0;
let lastTapTime = 0;

const handleTap = () => {
  const now = Date.now();
  if (now - lastTapTime < 300) {
    tapCount++;
    if (tapCount >= 3) {
      performEmergencyWipe();
    }
  } else {
    tapCount = 1;
  }
  lastTapTime = now;
};

const performEmergencyWipe = async () => {
  // Clear all local storage
  await SecureStore.deleteItemAsync('nostr_private_key');
  await SecureStore.deleteItemAsync('nostr_public_key');
  await AsyncStorage.clear();
  // Navigate to welcome screen
  router.replace('/');
};
```

---

## 8. Testing Requirements

### 8.1 Unit Tests
- All Zod validation schemas
- Message formatting functions
- Key generation utilities
- Share intent builders

### 8.2 Integration Tests
- Item creation flow
- Share sheet integration
- Nostr publishing
- Bluetooth scanning (manual)

### 8.3 E2E Tests
- User onboarding (key generation)
- Create and share item
- Receive and respond to message
- Emergency broadcast (simulation)

---

## 9. Environment Configuration

### 9.1 Environment Variables

```env
# Web (.env)
VITE_NOSTR_RELAYS=wss://relay.damus.io,wss://relay.nostr.band

# Mobile (app.json configExtra)
{
  "extra": {
    "NOSTR_RELAYS": ["wss://relay.damus.io", "wss://relay.nostr.band"],
    "BLE_SERVICE_UUID": "LENDLEE-MESH",
    "EMERGENCY_WIPE_TAPS": 3
  }
}
```

---

## 10. Build & Deployment

### 10.1 Web Build
```bash
# Build for production
npm run build

# Output: dist/
# Deploy to: Vercel, Netlify, Cloudflare Pages
```

### 10.2 Mobile Build
```bash
# Generate native iOS project
npx expo prebuild

# Build for simulator
npx expo run:ios

# Build for App Store
npx expo build:ios
```

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|--------------|
| App Launch | Month 1 | v1.0 shipped |
| Users | 10,000 | Downloads |
| Active Sharing | 5,000 | Monthly transactions |
| Messages Sent | 1,000 | Nostr DMs |
| Mesh Nodes | 500 | BLE connections |
| Emergency Test | Month 12 | Controlled test |

---

*Document Version: 2.0*  
*Last Updated: April 2026*  
*Status: Technical Specification*