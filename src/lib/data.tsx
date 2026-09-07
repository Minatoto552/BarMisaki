import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';

import type {
  Emergency,
  EmergencyKind,
  EmergencyStatus,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  NormalCocktailProduct,
  OriginalCocktailProduct,
  JuiceProduct,
  FoodProduct,
  NormalCocktailOrder,
  OriginalCocktailOrder,
  JuiceOrder,
  FoodOrder,
  UserProfile,
  CartItem,
  Announcement,
  AnnouncementKind,
} from '../types';
import { getFirebaseServices, runtimeMode } from './firebase';
import { sampleProducts } from './sample-data';
import { validateProduct, validateTableNumber } from './validation';

interface ProductDraft {
  category: ProductCategory;
  name: string;
  recipe: string;
  image: File | null;
}

export interface ProductEditDraft extends Omit<ProductDraft, 'image'> {
  image: File | null;
}

type ProductWithoutId = Omit<NormalCocktailProduct, 'id'> | Omit<OriginalCocktailProduct, 'id'> | Omit<JuiceProduct, 'id'> | Omit<FoodProduct, 'id'>;
type OrderWithoutId = Omit<NormalCocktailOrder, 'id'> | Omit<OriginalCocktailOrder, 'id'> | Omit<JuiceOrder, 'id'> | Omit<FoodOrder, 'id'>;

interface DataContextValue {
  ready: boolean;
  error: string | null;
  uid: string;
  profile: UserProfile | null;
  recoverableProfiles: UserProfile[];
  products: Product[];
  orders: Order[];
  emergencies: Emergency[];
  announcements: Announcement[];
  isStaff: boolean;
  runtimeMode: typeof runtimeMode;
  saveProfile: (displayName: string, image: File | null) => Promise<void>;
  restoreProfile: (source: UserProfile) => Promise<void>;
  addProduct: (draft: ProductDraft) => Promise<void>;
  updateProduct: (id: string, draft: ProductEditDraft, expectedUpdatedAt: string) => Promise<void>;
  deleteProduct: (id: string, expectedUpdatedAt: string) => Promise<void>;
  duplicateProduct: (id: string, draft: ProductEditDraft, expectedUpdatedAt: string) => Promise<void>;
  placeCart: (items: CartItem[], tableNumber: string) => Promise<string>;
  sendEmergency: (kind: EmergencyKind, message: string) => Promise<void>;
  sendAnnouncement: (kind: AnnouncementKind, message: string) => Promise<void>;
  updateEmergency: (id: string, status: EmergencyStatus) => Promise<void>;
  updateOrder: (id: string, status: OrderStatus) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);
const LOCAL_EVENT = 'vrc-order-local-data';
const KEYS = {
  uid: 'vrc-order-uid', profile: 'vrc-order-profile', products: 'vrc-order-products',
  orders: 'vrc-order-orders', emergencies: 'vrc-order-emergencies', announcements: 'vrc-order-announcements',
} as const;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(LOCAL_EVENT));
};

const cacheProfile = (value: UserProfile) => {
  localStorage.setItem(KEYS.profile, JSON.stringify(value));
};

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    reader.readAsDataURL(file);
  });

const compressImage = async (file: File, maxSide = 720, quality = 0.72): Promise<string> => {
  const source = await toDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('画像を処理できませんでした。'));
    element.src = source;
  });
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('画像を処理できませんでした。');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL('image/jpeg', quality);
  if (result.length > 320_000 && maxSide > 520) return compressImage(file, 520, 0.6);
  if (result.length > 320_000) throw new Error('画像サイズが大きすぎます。別の画像を選択してください。');
  return result;
};

const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nowIso = () => new Date().toISOString();
const GUEST_ICON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="32" fill="%236d4aa1"/%3E%3Ccircle cx="32" cy="25" r="11" fill="white"/%3E%3Cpath d="M13 56c2-12 10-18 19-18s17 6 19 18" fill="white"/%3E%3C/svg%3E';

const assertProductRevision = (product: Product | undefined, expectedUpdatedAt: string) => {
  if (!product) throw new Error('この商品はすでに削除されています。商品一覧をご確認ください。');
  if (product.updatedAt !== expectedUpdatedAt) throw new Error('他の端末で商品が変更されました。一度閉じて最新の商品を選び直してください。');
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(runtimeMode === 'sample');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [localUid] = useState(() => {
    const previous = localStorage.getItem(KEYS.uid);
    const next = previous || `local-${makeId()}`;
    localStorage.setItem(KEYS.uid, next);
    return next;
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => readJson(KEYS.profile, null));
  const [knownProfiles, setKnownProfiles] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>(() => readJson(KEYS.products, sampleProducts));
  const [orders, setOrders] = useState<Order[]>(() => readJson(KEYS.orders, []));
  const [emergencies, setEmergencies] = useState<Emergency[]>(() => readJson(KEYS.emergencies, []));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => readJson(KEYS.announcements, []));
  const [isStaff, setIsStaff] = useState(true);
  const lastMutation = useRef(0);
  const recoveringProfile = useRef(false);

  useEffect(() => {
    if (runtimeMode === 'sample') {
      const syncLocal = () => {
        setProfile(readJson(KEYS.profile, null));
        setProducts(readJson(KEYS.products, sampleProducts));
        setOrders(readJson(KEYS.orders, []));
        setEmergencies(readJson(KEYS.emergencies, []));
        setAnnouncements(readJson(KEYS.announcements, []));
      };
      window.addEventListener(LOCAL_EVENT, syncLocal);
      window.addEventListener('storage', syncLocal);
      return () => {
        window.removeEventListener(LOCAL_EVENT, syncLocal);
        window.removeEventListener('storage', syncLocal);
      };
    }

    let disposed = false;
    let unsubscribe = () => {};
    void getFirebaseServices()
      .then(({ auth, authApi }) => {
        if (disposed || !auth || !authApi) return;
        unsubscribe = authApi.onAuthStateChanged(auth, (nextUser) => {
          if (nextUser) {
            setUser(nextUser);
            setIsStaff(true);
          } else {
            void authApi.signInAnonymously(auth).catch((reason: unknown) => {
              const detail = reason instanceof Error ? reason.message : String(reason);
              setError(`匿名ログインに失敗しました。${detail}`);
              setReady(true);
            });
          }
        });
      })
      .catch((reason: unknown) => {
        if (disposed) return;
        const detail = reason instanceof Error ? reason.message : String(reason);
        setError(`接続の準備に失敗しました。${detail}`);
        setReady(true);
      });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let disposed = false;
    let unsubscribers: Array<() => void> = [];
    void getFirebaseServices().then(({ db, firestoreApi }) => {
      if (disposed || !db || !firestoreApi) return;
      const { collection, doc, onSnapshot, orderBy, query, where } = firestoreApi;
      unsubscribers = [
        onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
          if (snapshot.exists()) {
            const current = { id: snapshot.id, ...snapshot.data() } as UserProfile;
            cacheProfile(current);
            setProfile(current);
            recoveringProfile.current = false;
            return;
          }
          const cached = readJson<UserProfile | null>(KEYS.profile, null);
          if (!cached || recoveringProfile.current) {
            setProfile(null);
            return;
          }
          recoveringProfile.current = true;
          const restored: UserProfile = {
            ...cached,
            id: user.uid,
            updatedAt: nowIso(),
          };
          cacheProfile(restored);
          setProfile(restored);
          void firestoreApi.setDoc(doc(db, 'users', user.uid), restored).catch((reason: unknown) => {
            recoveringProfile.current = false;
            setProfile(null);
            const detail = reason instanceof Error ? reason.message : String(reason);
            setError(`アカウント情報を復元できませんでした。${detail}`);
          });
        }),
        onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snapshot) => {
          setProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Product));
          setReady(true);
        }),
        onSnapshot(query(collection(db, 'orders'), ...(isStaff ? [] : [where('orderedBy', '==', user.uid)]), orderBy('createdAt', 'desc')), (snapshot) => {
          setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Order));
        }),
        onSnapshot(query(collection(db, 'emergencies'), orderBy('createdAt', 'desc')), (snapshot) => {
          setEmergencies(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Emergency));
        }),
        onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => {
          setAnnouncements(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Announcement));
        }),
        onSnapshot(collection(db, 'users'), (snapshot) => {
          setKnownProfiles(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as UserProfile));
        }),
      ];
    });
    return () => {
      disposed = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [isStaff, user]);

  const uploadImage = useCallback(async (file: File, path: string) => {
    void path;
    return compressImage(file);
  }, []);

  const requireProfile = useCallback(() => {
    if (!profile) throw new Error('先にアカウントを登録してください。');
    return profile;
  }, [profile]);

  const ensureProfile = useCallback(async () => {
    if (profile) return profile;
    if (runtimeMode !== 'sample' && !user) throw new Error('接続の準備中です。少し待ってからもう一度お試しください。');
    const uid = user?.uid || localUid;
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) {
      const reference = firestoreApi.doc(db, 'users', uid);
      const snapshot = await firestoreApi.getDoc(reference);
      if (snapshot.exists()) {
        const existing = { id: snapshot.id, ...snapshot.data() } as UserProfile;
        setProfile(existing);
        return existing;
      }
    }
    const cached = readJson<UserProfile | null>(KEYS.profile, null);
    const timestamp = nowIso();
    const created: UserProfile = {
      id: uid,
      displayName: cached?.displayName || 'ゲスト',
      iconUrl: cached?.iconUrl || GUEST_ICON,
      createdAt: cached?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    if (db && firestoreApi) await firestoreApi.setDoc(firestoreApi.doc(db, 'users', uid), created);
    else writeJson(KEYS.profile, created);
    cacheProfile(created);
    setProfile(created);
    return created;
  }, [localUid, profile, user]);

  const throttle = () => {
    if (Date.now() - lastMutation.current < 1800) throw new Error('連続操作を避け、少し待ってからお試しください。');
    lastMutation.current = Date.now();
  };

  const saveProfile = useCallback(async (displayName: string, image: File | null) => {
    throttle();
    const uid = user?.uid || localUid;
    const iconUrl = image ? await uploadImage(image, `users/${uid}`) : profile?.iconUrl;
    if (!iconUrl) throw new Error('アイコンを選択してください。');
    const timestamp = nowIso();
    const next: UserProfile = {
      id: uid, displayName: displayName.trim(), iconUrl,
      createdAt: profile?.createdAt || timestamp, updatedAt: timestamp,
    };
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) {
      await firestoreApi.setDoc(firestoreApi.doc(db, 'users', uid), next);
    } else {
      writeJson(KEYS.profile, next);
    }
    cacheProfile(next);
    setProfile(next);
  }, [localUid, profile?.createdAt, profile?.iconUrl, uploadImage, user?.uid]);

  const restoreProfile = useCallback(async (source: UserProfile) => {
    if (runtimeMode !== 'sample' && !user) throw new Error('接続の準備中です。');
    const uid = user?.uid || localUid;
    const timestamp = nowIso();
    const restored: UserProfile = { ...source, id: uid, updatedAt: timestamp };
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) await firestoreApi.setDoc(firestoreApi.doc(db, 'users', uid), restored);
    else writeJson(KEYS.profile, restored);
    cacheProfile(restored);
    setProfile(restored);
  }, [localUid, user]);

  const addProduct = useCallback(async (draft: ProductDraft) => {
    throttle();
    const current = await ensureProfile();
    const errors = validateProduct(draft.category, draft.name, draft.image, draft.recipe);
    if (errors.length) throw new Error(errors.join('\n'));
    const imageUrl = draft.image ? await uploadImage(draft.image, `products/${current.id}`) : '';
    const timestamp = nowIso();
    const base = {
      name: draft.name.trim(), imageUrl, createdBy: current.id, creatorName: current.displayName,
      isAvailable: true, createdAt: timestamp, updatedAt: timestamp,
    };
    const next: ProductWithoutId = draft.category === 'original_cocktail'
      ? { ...base, category: draft.category, recipe: draft.recipe.trim() }
      : { ...base, category: draft.category };
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) {
      await firestoreApi.addDoc(firestoreApi.collection(db, 'products'), next);
    } else {
      writeJson(KEYS.products, [{ id: makeId(), ...next }, ...products]);
    }
  }, [ensureProfile, products, uploadImage]);

  const updateProduct = useCallback(async (id: string, draft: ProductEditDraft, expectedUpdatedAt: string) => {
    requireProfile();
    const existing = products.find((product) => product.id === id);
    assertProductRevision(existing, expectedUpdatedAt);
    const errors = validateProduct(draft.category, draft.name, draft.image, draft.recipe);
    if (errors.length) throw new Error(errors.join('\n'));
    throttle();
    const imageUrl = draft.image ? await uploadImage(draft.image, `products/${id}`) : undefined;
    const updatedAt = nowIso();
    const changes = {
      name: draft.name.trim(), category: draft.category, updatedAt,
      ...(imageUrl ? { imageUrl } : {}),
    };
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) {
      const productRef = firestoreApi.doc(db, 'products', id);
      await firestoreApi.runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(productRef);
        assertProductRevision(snapshot.exists() ? { id, ...snapshot.data() } as Product : undefined, expectedUpdatedAt);
        // Update only editable fields. Never recreate a deleted item or overwrite its creator.
        transaction.update(productRef, {
          ...changes,
          recipe: draft.category === 'original_cocktail' ? draft.recipe.trim() : firestoreApi.deleteField(),
        });
      });
    } else {
      const current = readJson<Product[]>(KEYS.products, products);
      assertProductRevision(current.find((product) => product.id === id), expectedUpdatedAt);
      writeJson(KEYS.products, current.map((product) => {
        if (product.id !== id) return product;
        const { id: productId, imageUrl: previousImage, createdBy, creatorName, isAvailable, createdAt } = product;
        const base = { id: productId, imageUrl: imageUrl || previousImage, createdBy, creatorName, isAvailable, createdAt, ...changes };
        return draft.category === 'original_cocktail' ? { ...base, category: draft.category, recipe: draft.recipe.trim() } : { ...base, category: draft.category };
      }));
    }
  }, [products, requireProfile, uploadImage]);

  const duplicateProduct = useCallback(async (id: string, draft: ProductEditDraft, expectedUpdatedAt: string) => {
    const current = requireProfile();
    const source = products.find(product => product.id === id);
    assertProductRevision(source, expectedUpdatedAt);
    const errors = validateProduct(draft.category, draft.name, draft.image, draft.recipe);
    if (errors.length) throw new Error(errors.join('\n'));
    throttle();
    const imageUrl = draft.image ? await uploadImage(draft.image, `products/${current.id}`) : source!.imageUrl;
    const timestamp = nowIso();
    const base = { name: draft.name.trim(), imageUrl, createdBy: current.id, creatorName: current.displayName, isAvailable: true, createdAt: timestamp, updatedAt: timestamp };
    const next: ProductWithoutId = draft.category === 'original_cocktail' ? { ...base, category: draft.category, recipe: draft.recipe.trim() } : { ...base, category: draft.category };
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) await firestoreApi.addDoc(firestoreApi.collection(db, 'products'), next);
    else writeJson(KEYS.products, [{ id: makeId(), ...next }, ...products]);
  }, [products, requireProfile, uploadImage]);

  const deleteProduct = useCallback(async (id: string, expectedUpdatedAt: string) => {
    requireProfile();
    throttle();
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) {
      const productRef = firestoreApi.doc(db, 'products', id);
      await firestoreApi.runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(productRef);
        assertProductRevision(snapshot.exists() ? { id, ...snapshot.data() } as Product : undefined, expectedUpdatedAt);
        transaction.delete(productRef);
      });
    } else {
      const current = readJson<Product[]>(KEYS.products, products);
      assertProductRevision(current.find((product) => product.id === id), expectedUpdatedAt);
      writeJson(KEYS.products, current.filter((product) => product.id !== id));
    }
  }, [products, requireProfile]);

  const placeCart = useCallback(async (items: CartItem[], tableNumber: string) => {
    const tableError = validateTableNumber(tableNumber);
    if (tableError) throw new Error(tableError);
    throttle();
    const current = requireProfile();
    const timestamp = nowIso();
    const receiptNumber = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
    const cartId = makeId();
    const nextOrders = items.flatMap(({ product, options, quantity }) => Array.from({ length: quantity }, (): OrderWithoutId => {
      const base = {
        receiptNumber, cartId, tableNumber: tableNumber.trim(),
        productId: product.id, productName: product.name, productImageUrl: product.imageUrl,
        orderedBy: current.id, ordererName: current.displayName,
        status: 'pending' as const, createdAt: timestamp, updatedAt: timestamp,
      };
      if (product.category === 'normal_cocktail') {
        return {
          ...base, category: product.category, color1: options.color1!, color2: options.color2!,
          carbonated: options.carbonated!, aphrodisiac: options.aphrodisiac!,
        };
      }
      if (product.category === 'original_cocktail') return { ...base, category: product.category, recipe: product.recipe };
      return { ...base, category: product.category };
    }));
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) {
      const batch = firestoreApi.writeBatch(db);
      nextOrders.forEach((next) => batch.set(firestoreApi.doc(firestoreApi.collection(db, 'orders')), next));
      await batch.commit();
    } else {
      writeJson(KEYS.orders, [...nextOrders.map((next) => ({ id: makeId(), ...next } as Order)), ...orders]);
    }
    return receiptNumber;
  }, [orders, requireProfile]);

  const sendEmergency = useCallback(async (kind: EmergencyKind, message: string) => {
    throttle();
    const current = requireProfile();
    const timestamp = nowIso();
    const next: Omit<Emergency, 'id'> = {
      kind, message: message.trim(), createdBy: current.id, creatorName: current.displayName,
      creatorIconUrl: current.iconUrl, status: 'active', createdAt: timestamp, updatedAt: timestamp,
    };
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) await firestoreApi.addDoc(firestoreApi.collection(db, 'emergencies'), next);
    else writeJson(KEYS.emergencies, [{ id: makeId(), ...next }, ...emergencies]);
  }, [emergencies, requireProfile]);

  const sendAnnouncement = useCallback(async (kind: AnnouncementKind, message: string) => {
    throttle();
    const current = requireProfile();
    const timestamp = nowIso();
    const next: Omit<Announcement, 'id'> = {
      kind, message: message.trim(), createdBy: current.id, creatorName: current.displayName,
      createdAt: timestamp, updatedAt: timestamp,
    };
    if (!next.message || next.message.length > 300) throw new Error('お知らせは1〜300文字で入力してください。');
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) await firestoreApi.addDoc(firestoreApi.collection(db, 'announcements'), next);
    else writeJson(KEYS.announcements, [{ id: makeId(), ...next }, ...announcements]);
  }, [announcements, requireProfile]);

  const updateEmergency = useCallback(async (id: string, status: EmergencyStatus) => {
    const updatedAt = nowIso();
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) await firestoreApi.updateDoc(firestoreApi.doc(db, 'emergencies', id), { status, updatedAt });
    else writeJson(KEYS.emergencies, emergencies.map((item) => item.id === id ? { ...item, status, updatedAt } : item));
  }, [emergencies]);

  const updateOrder = useCallback(async (id: string, status: OrderStatus) => {
    const updatedAt = nowIso();
    const { db, firestoreApi } = await getFirebaseServices();
    if (db && firestoreApi) {
      const orderRef = firestoreApi.doc(db, 'orders', id);
      if ((await firestoreApi.getDoc(orderRef)).exists()) await firestoreApi.updateDoc(orderRef, { status, updatedAt });
    } else {
      const currentOrders = readJson<Order[]>(KEYS.orders, orders);
      writeJson(KEYS.orders, currentOrders.map((item) => item.id === id ? { ...item, status, updatedAt } : item));
    }
  }, [orders]);

  const value = useMemo<DataContextValue>(() => ({
    ready, error, uid: user?.uid || localUid, profile,
    recoverableProfiles: knownProfiles.filter((candidate) => candidate.id !== user?.uid && products.some((product) => product.createdBy === candidate.id)),
    products, orders, emergencies, announcements, isStaff,
    runtimeMode, saveProfile, restoreProfile, addProduct, updateProduct, deleteProduct, duplicateProduct, placeCart, sendEmergency, sendAnnouncement, updateEmergency, updateOrder,
  }), [addProduct, announcements, emergencies, error, isStaff, localUid, orders, products, profile, ready,
    saveProfile, restoreProfile, knownProfiles, sendAnnouncement, sendEmergency, updateEmergency, updateOrder, user?.uid, placeCart, updateProduct, deleteProduct, duplicateProduct]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
};
