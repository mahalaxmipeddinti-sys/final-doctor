// tests/auth.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mapSupabaseUserToAppUser, authService } from '../src/services/auth.service.ts';
import { getRecentAnalyses, saveAnalysisToDatabase, deleteAnalysisById, getAnalysisById } from '../src/db/analyses.ts';
import { normalizeVariantInput } from '../src/services/variantNormalization.ts';

describe('Auth Module: User Mapping & Session Integrity', () => {
  it('maps Supabase User to AppUser correctly with full metadata', () => {
    const mockSupabaseUser: any = {
      id: 'usr-genomics-101',
      email: 'dr.vance@precision.org',
      created_at: '2026-10-10T12:00:00Z',
      user_metadata: {
        full_name: 'Dr. Alex Vance, MD',
        role: 'Chief Molecular Pathologist',
        institution: 'National Genomic Research Center',
        avatar_url: 'https://example.org/avatar.jpg',
      },
    };

    const mapped = mapSupabaseUserToAppUser(mockSupabaseUser);
    assert.strictEqual(mapped.uid, 'usr-genomics-101');
    assert.strictEqual(mapped.id, 'usr-genomics-101');
    assert.strictEqual(mapped.email, 'dr.vance@precision.org');
    assert.strictEqual(mapped.displayName, 'Dr. Alex Vance, MD');
    assert.strictEqual(mapped.role, 'Chief Molecular Pathologist');
    assert.strictEqual(mapped.institution, 'National Genomic Research Center');
    assert.strictEqual(mapped.photoURL, 'https://example.org/avatar.jpg');
  });

  it('falls back gracefully when user metadata is missing', () => {
    const mockSupabaseUser: any = {
      id: 'usr-anonymous-202',
      email: 'investigator@hospital.org',
      created_at: '2026-10-10T12:00:00Z',
      user_metadata: {},
    };

    const mapped = mapSupabaseUserToAppUser(mockSupabaseUser);
    assert.strictEqual(mapped.uid, 'usr-anonymous-202');
    assert.strictEqual(mapped.displayName, 'investigator');
    assert.strictEqual(mapped.role, 'Clinical Geneticist');
    assert.strictEqual(mapped.photoURL, null);
  });
});

describe('Database Layer: User Isolation & Row-Level Authorization', () => {
  it('isolates user analysis history by authenticated userId', async () => {
    const dummyVariant = normalizeVariantInput('17661');

    const analysisUserA: any = {
      analysisId: 'ana-user-a-01',
      normalizedVariant: dummyVariant,
      summaryStatus: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    const analysisUserB: any = {
      analysisId: 'ana-user-b-02',
      normalizedVariant: dummyVariant,
      summaryStatus: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    // Save for User A
    await saveAnalysisToDatabase(analysisUserA, 'user-a');
    // Save for User B
    await saveAnalysisToDatabase(analysisUserB, 'user-b');

    // Query for User A
    const recordsUserA = await getRecentAnalyses(10, 'user-a');
    const userAIds = recordsUserA.map((r: any) => r.analysisId);
    assert.ok(userAIds.includes('ana-user-a-01'));
    assert.ok(!userAIds.includes('ana-user-b-02'), 'User A must not see User B analysis record');

    // Query for User B
    const recordsUserB = await getRecentAnalyses(10, 'user-b');
    const userBIds = recordsUserB.map((r: any) => r.analysisId);
    assert.ok(userBIds.includes('ana-user-b-02'));
    assert.ok(!userBIds.includes('ana-user-a-01'), 'User B must not see User A analysis record');
  });

  it('prevents unauthorized user from deleting another user record', async () => {
    const dummyVariant = normalizeVariantInput('7105');
    const record: any = {
      analysisId: 'protected-ana-99',
      normalizedVariant: dummyVariant,
      summaryStatus: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    await saveAnalysisToDatabase(record, 'legit-clinician-1');

    // Malicious or mismatched user attempts delete
    const deleteAttempt = await deleteAnalysisById('protected-ana-99', 'intruder-user-2');
    assert.strictEqual(deleteAttempt, false, 'Deletion must be rejected when userId does not match');

    // Legitimate owner deletes
    const legitDelete = await deleteAnalysisById('protected-ana-99', 'legit-clinician-1');
    assert.strictEqual(legitDelete, true, 'Legitimate owner can delete record');
  });
});
