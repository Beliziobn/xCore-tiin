import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import type { UserAccount } from '../types';

export async function getUserProfile(userId: string): Promise<UserAccount | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      id: userId,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      role: data.role || 'diretor',
      scope: data.scope,
      schoolRole: data.schoolRole,
      adminRole: data.adminRole,
      cargoTitle: data.cargoTitle,
      schoolName: data.schoolName,
      municipalityOrDepartment: data.municipalityOrDepartment,
      titlePrefix: data.titlePrefix,
      greeting: `Olá ${data.titlePrefix ? data.titlePrefix + ' ' : ''}${data.firstName}`,
      accountValidated: data.accountValidated ?? false,
      emailVerified: auth.currentUser?.emailVerified ?? data.emailVerified ?? false,
      status: data.status || 'ativo',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      rememberMe: true,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(user: UserAccount): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const docRef = doc(db, 'users', user.id);
    const payload: Record<string, any> = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      status: user.status || 'ativo',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accountValidated: user.accountValidated ?? false,
      emailVerified: auth.currentUser?.emailVerified ?? user.emailVerified ?? false,
    };

    if (user.lastName) payload.lastName = user.lastName;
    if (user.scope) payload.scope = user.scope;
    if (user.schoolRole) payload.schoolRole = user.schoolRole;
    if (user.adminRole) payload.adminRole = user.adminRole;
    if (user.cargoTitle) payload.cargoTitle = user.cargoTitle;
    if (user.schoolName) payload.schoolName = user.schoolName;
    if (user.municipalityOrDepartment) payload.municipalityOrDepartment = user.municipalityOrDepartment;
    if (user.titlePrefix) payload.titlePrefix = user.titlePrefix;

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAccountValidation(userId: string, validated: boolean, status: 'ativo' | 'validado' | 'pendente' | 'em_analise'): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      accountValidated: validated,
      status: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
