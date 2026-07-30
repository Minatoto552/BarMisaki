import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let environment: RulesTestEnvironment;
const timestamp = '2026-07-29T12:00:00.000Z';

const profile = (uid: string) => ({
  id: uid,
  displayName: 'テストユーザー',
  iconUrl: 'https://example.com/icon.png',
  createdAt: timestamp,
  updatedAt: timestamp,
});

const order = (uid: string) => ({
  receiptNumber: '12345',
  cartId: 'cart-1',
  tableNumber: 'A-3',
  productId: 'drink-1',
  productName: 'テストドリンク',
  productImageUrl: 'https://example.com/drink.png',
  category: 'normal_cocktail',
  orderedBy: uid,
  ordererName: 'テストユーザー',
  status: 'pending',
  createdAt: timestamp,
  updatedAt: timestamp,
  color1: 'red',
  color2: 'red',
  carbonated: true,
  aphrodisiac: false,
});

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'vrc-order-management-test',
    firestore: { rules: readFileSync(resolve('firestore.rules'), 'utf8') },
  });
});

beforeEach(async () => environment?.clearFirestore());
afterAll(async () => environment?.cleanup());

describe('Firestore Security Rules', () => {
  it('本人だけが自分の簡易プロフィールを登録できる', async () => {
    const alice = environment.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(alice, 'users/alice'), profile('alice')));
    await assertFails(setDoc(doc(alice, 'users/bob'), profile('bob')));
  });

  it('登録済みユーザーは同じ色を2つ選んだ注文を作成できる', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice'), profile('alice'));
    });
    const alice = environment.authenticatedContext('alice').firestore();
    await assertSucceeds(addDoc(collection(alice, 'orders'), order('alice')));
  });

  it('色が不足したノーマルカクテル注文を拒否する', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice'), profile('alice'));
    });
    const alice = environment.authenticatedContext('alice').firestore();
    const invalid = order('alice');
    Reflect.deleteProperty(invalid, 'color2');
    await assertFails(addDoc(collection(alice, 'orders'), invalid));
  });

  it('注文状態の変更はスタッフだけに許可する', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'orders/order-1'), order('alice'));
    });
    const alice = environment.authenticatedContext('alice').firestore();
    const staff = environment.authenticatedContext('staff', { staff: true }).firestore();
    await assertFails(updateDoc(doc(alice, 'orders/order-1'), { status: 'preparing', updatedAt: timestamp }));
    await assertSucceeds(updateDoc(doc(staff, 'orders/order-1'), { status: 'preparing', updatedAt: timestamp }));
  });

  it('緊急通知は登録済みユーザーだけが作成できる', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice'), profile('alice'));
    });
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const alert = {
      kind: 'help', message: '入口付近', createdBy: 'alice', creatorName: 'テストユーザー',
      creatorIconUrl: 'https://example.com/icon.png', status: 'active', createdAt: timestamp, updatedAt: timestamp,
    };
    await assertSucceeds(addDoc(collection(alice, 'emergencies'), alert));
    await assertFails(addDoc(collection(bob, 'emergencies'), { ...alert, createdBy: 'bob' }));
  });

  it('お知らせは登録済みユーザーだけが正しいカテゴリーで作成できる', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice'), profile('alice'));
    });
    const alice = environment.authenticatedContext('alice').firestore();
    const bob = environment.authenticatedContext('bob').firestore();
    const announcement = {
      kind: 'notice', message: 'ラストオーダーは4時です', createdBy: 'alice', creatorName: 'テストユーザー',
      createdAt: timestamp, updatedAt: timestamp,
    };
    await assertSucceeds(addDoc(collection(alice, 'announcements'), announcement));
    await assertFails(addDoc(collection(alice, 'announcements'), { ...announcement, kind: 'unknown' }));
    await assertFails(addDoc(collection(bob, 'announcements'), { ...announcement, createdBy: 'bob' }));
  });
});
