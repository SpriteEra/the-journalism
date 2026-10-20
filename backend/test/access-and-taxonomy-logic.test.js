import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Category from '../model/category.model.js';
import State from '../model/state.model.js';
import District from '../model/district.model.js';
import Role from '../model/role.model.js';
import { resolveNewsTaxonomy } from '../utils/newsTaxonomy.js';
import { buildAccess, invalidateRoles } from '../service/access.service.js';
import { assertOwnOrAny, requireAnyPermission, requirePermission } from '../middleware/Authentication.js';
import { P } from '../config/permissions.js';
import { resolveEffective } from '../utils/permissions.js';

const oid = () => new mongoose.Types.ObjectId();
const chain = (rows) => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean: async () => rows, then(res, rej) { return Promise.resolve(rows).then(res, rej); } });

// ── fixture: 2 categories, 2 sub-categories, 2 states, 3 districts ──
const politics = { _id: oid(), name: 'Politics', slug: 'politics', parent: null, isActive: true };
const sports = { _id: oid(), name: 'Sports', slug: 'sports', parent: null, isActive: true };
const elections = { _id: oid(), name: 'Elections', slug: 'elections', parent: politics._id, isActive: true };
const cricket = { _id: oid(), name: 'Cricket', slug: 'cricket', parent: sports._id, isActive: true };
const inactive = { _id: oid(), name: 'Old', slug: 'old', parent: null, isActive: false };
const up = { _id: oid(), state: 'uttar pradesh', slug: 'uttar-pradesh', isActive: true };
const bihar = { _id: oid(), state: 'bihar', slug: 'bihar', isActive: true };
const varanasi = { _id: oid(), district: 'varanasi', slug: 'varanasi', state: up._id, isActive: true };
const patna = { _id: oid(), district: 'patna', slug: 'patna', state: bihar._id, isActive: true };
const cats = [politics, sports, elections, cricket, inactive]; const states = [up, bihar]; const dists = [varanasi, patna];

const inList = (docs) => (q) => chain(docs.filter((d) => (q._id?.$in || []).some((i) => String(i) === String(d._id))));
Category.find = inList(cats); State.find = inList(states); District.find = inList(dists);
const S = String;

test('category is required (>=1); sub-category / state / district may be empty', async () => {
    await assert.rejects(resolveNewsTaxonomy({}), /At least one category is required/);
    await assert.rejects(resolveNewsTaxonomy({ category: '[]' }), /At least one category is required/);
    const r = await resolveNewsTaxonomy({ category: [S(politics._id)] });
    assert.deepEqual(r.category, [S(politics._id)]);
    assert.deepEqual([r.subCategory, r.state, r.district], [[], [], []]);
    // drafts may skip the category
    assert.deepEqual((await resolveNewsTaxonomy({}, { requireCategory: false })).category, []);
});

test('sub-category must belong to a selected category; a lone sub-category pulls its parent in', async () => {
    await assert.rejects(resolveNewsTaxonomy({ category: [S(politics._id)], subCategory: [S(cricket._id)] }), /does not belong/);
    const ok = await resolveNewsTaxonomy({ category: [S(politics._id), S(sports._id)], subCategory: [S(elections._id), S(cricket._id)] });
    assert.equal(ok.subCategory.length, 2);
    const derived = await resolveNewsTaxonomy({ subCategory: [S(elections._id)] });
    assert.deepEqual(derived.category, [S(politics._id)]);
});

test('category vs sub-category slots cannot be mixed up; unknown / inactive ids are rejected', async () => {
    await assert.rejects(resolveNewsTaxonomy({ category: [S(elections._id)] }), /is a sub-category/);
    await assert.rejects(resolveNewsTaxonomy({ category: [S(politics._id)], subCategory: [S(sports._id)] }), /top-level category/);
    await assert.rejects(resolveNewsTaxonomy({ category: [S(oid())] }), /Category not found/);
    await assert.rejects(resolveNewsTaxonomy({ category: [S(inactive._id)] }), /inactive/);
    // ...but a news that ALREADY has an now-inactive category can keep it
    const kept = await resolveNewsTaxonomy({ category: [S(inactive._id)] }, { existing: { category: [inactive._id] } });
    assert.deepEqual(kept.category, [S(inactive._id)]);
});

test('states / districts come from the collections and must be consistent', async () => {
    const ok = await resolveNewsTaxonomy({ category: [S(politics._id)], state: [S(up._id)], district: [S(varanasi._id)] });
    assert.deepEqual([ok.state, ok.district], [[S(up._id)], [S(varanasi._id)]]);
    await assert.rejects(resolveNewsTaxonomy({ category: [S(politics._id)], state: [S(up._id)], district: [S(patna._id)] }), /does not belong to the selected states/);
    await assert.rejects(resolveNewsTaxonomy({ category: [S(politics._id)], state: [S(oid())] }), /State not found/);
    // only a district sent -> its state is filled in automatically
    const derived = await resolveNewsTaxonomy({ category: [S(politics._id)], district: [S(patna._id)] });
    assert.deepEqual(derived.state, [S(bihar._id)]);
});

test('selection limits are enforced before any DB lookup', async () => {
    const many = Array.from({ length: 11 }, () => S(oid()));
    await assert.rejects(resolveNewsTaxonomy({ category: many }), /at most 10 categories/);
});

// ── access ──
const fakeUser = (o = {}) => ({ _id: oid(), role: 'reporter', trusted: false, permissionOverrides: { grant: [], deny: [] }, ...o });
const stubRoles = (rows) => { Role.find = () => chain(rows); invalidateRoles(); };
const roleRows = [
    { name: 'admin', isActive: true, isSystem: true, permissions: ['*'] },
    { name: 'reporter', isActive: true, isSystem: true, permissions: [P.NEWS_CREATE, P.NEWS_UPDATE_OWN, P.NEWS_VIEW_OWN] },
    { name: 'desk-editor', isActive: true, permissions: [P.NEWS_CREATE, 'news.update.any', P.NEWS_APPROVE, P.NEWS_PUBLISH] },
    { name: 'retired', isActive: false, permissions: [P.NEWS_CREATE] },
];

test('buildAccess: custom roles, overrides, trusted, disabled and unknown roles', async () => {
    stubRoles(roleRows);
    assert.equal((await buildAccess(fakeUser({ role: 'admin' }))).isSuper, true);
    const rep = await buildAccess(fakeUser());
    assert.ok(rep.permissions.has(P.NEWS_CREATE) && !rep.permissions.has(P.NEWS_PUBLISH));
    assert.ok((await buildAccess(fakeUser({ trusted: true }))).permissions.has(P.NEWS_PUBLISH));
    assert.ok((await buildAccess(fakeUser({ role: 'desk-editor' }))).permissions.has(P.NEWS_APPROVE));
    const tweaked = await buildAccess(fakeUser({ permissionOverrides: { grant: [P.ANALYTICS_VIEW], deny: [P.NEWS_CREATE] } }));
    assert.ok(tweaked.permissions.has(P.ANALYTICS_VIEW) && !tweaked.permissions.has(P.NEWS_CREATE));
    const disabled = await buildAccess(fakeUser({ role: 'retired' }));
    assert.equal(disabled.roleActive, false); assert.equal(disabled.permissions.size, 0);
    const ghost = await buildAccess(fakeUser({ role: 'deleted-role' }));
    assert.equal(ghost.permissions.size, 0);                                    // fail closed
    // deny can never strip the admin role
    const adm = await buildAccess(fakeUser({ role: 'admin', permissionOverrides: { grant: [], deny: [P.USER_DELETE] } }));
    assert.ok(adm.permissions.has(P.USER_DELETE));
});

// Fastify hooks: resolve => allowed, throw => refused
const run = async (mw, access) => { try { await mw({ access }); return undefined; } catch (err) { return err; } };
const accessOf = (keys) => resolveEffective({ rolePermissions: keys });

test('requirePermission / requireAnyPermission guards', async () => {
    const acc = accessOf([P.NEWS_CREATE]);
    assert.equal(await run(requirePermission(P.NEWS_CREATE), acc), undefined);
    const e1 = await run(requirePermission(P.NEWS_CREATE, P.NEWS_PUBLISH), acc);
    assert.equal(e1.statusCode, 403); assert.match(e1.message, /news\.publish/);
    assert.equal(await run(requireAnyPermission(P.NEWS_PUBLISH, P.NEWS_CREATE), acc), undefined);
    assert.equal((await run(requireAnyPermission(P.NEWS_PUBLISH, P.NEWS_APPROVE), acc)).statusCode, 403);
    assert.equal((await run(requirePermission(P.NEWS_CREATE), undefined)).statusCode, 401);   // not authenticated
});

test('assertOwnOrAny: own vs any', () => {
    const me = oid(); const other = oid();
    const req = (keys) => ({ user: { _id: me }, access: accessOf(keys) });
    assert.doesNotThrow(() => assertOwnOrAny(req([P.NEWS_UPDATE_OWN]), me, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY));
    assert.throws(() => assertOwnOrAny(req([P.NEWS_UPDATE_OWN]), other, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY), /not allowed|permission/i);
    assert.doesNotThrow(() => assertOwnOrAny(req([P.NEWS_UPDATE_ANY]), other, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY));
    assert.throws(() => assertOwnOrAny(req([]), me, P.NEWS_UPDATE_OWN, P.NEWS_UPDATE_ANY));
});
