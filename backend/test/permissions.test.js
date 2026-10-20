import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_PERMISSION_KEYS, PERMISSIONS as P, SYSTEM_ROLES, TRUSTED_PERMISSIONS } from '../config/permissions.js';
import { expand, matches, missingFrom, resolveEffective, validatePermissionList } from '../utils/permissions.js';

test('registry has no duplicate keys and every key is module.action[.scope]', () => {
    assert.equal(new Set(ALL_PERMISSION_KEYS).size, ALL_PERMISSION_KEYS.length);
    for (const k of ALL_PERMISSION_KEYS) assert.match(k, /^[a-z]+(\.[a-z]+){1,2}$/, k);
});

test('wildcard matching', () => {
    assert.ok(matches('*', 'news.create'));
    assert.ok(matches('news.*', 'news.update.own'));
    assert.ok(!matches('news.*', 'newsletter.create'));
    assert.ok(!matches('news.create', 'news.create.own'));
});

test('admin role expands to every permission; reporter keeps its narrow set', () => {
    assert.equal(expand(SYSTEM_ROLES.admin.permissions).size, ALL_PERMISSION_KEYS.length);
    const rep = expand(SYSTEM_ROLES.reporter.permissions);
    assert.ok(rep.has(P.NEWS_CREATE) && rep.has(P.NEWS_UPDATE_OWN));
    for (const k of [P.NEWS_PUBLISH, P.NEWS_APPROVE, P.NEWS_UPDATE_ANY, P.NEWS_DELETE_ANY, P.ANALYTICS_VIEW, P.USER_BLOCK, P.ROLE_CREATE]) assert.ok(!rep.has(k), `reporter must not have ${k}`);
});

test('effective permissions = role + trusted extras + grant - deny', () => {
    const base = { rolePermissions: SYSTEM_ROLES.reporter.permissions };
    assert.ok(!resolveEffective(base).permissions.has(P.NEWS_PUBLISH));
    assert.ok(resolveEffective({ ...base, trusted: true }).permissions.has(P.NEWS_PUBLISH));
    TRUSTED_PERMISSIONS.forEach((k) => assert.ok(resolveEffective({ ...base, trusted: true }).permissions.has(k)));
    assert.ok(resolveEffective({ ...base, grant: [P.ANALYTICS_VIEW] }).permissions.has(P.ANALYTICS_VIEW));
    // deny always wins, even over trusted + grant
    const denied = resolveEffective({ ...base, trusted: true, grant: [P.NEWS_PUBLISH], deny: [P.NEWS_PUBLISH, P.NEWS_CREATE] }).permissions;
    assert.ok(!denied.has(P.NEWS_PUBLISH) && !denied.has(P.NEWS_CREATE));
    assert.equal(resolveEffective({ rolePermissions: ['*'] }).isSuper, true);
    assert.equal(resolveEffective(base).isSuper, false);
});

test('unknown / missing role => no permissions (fail closed)', () => {
    assert.equal(resolveEffective({ rolePermissions: [] }).permissions.size, 0);
});

test('validatePermissionList: rejects unknown keys, "*", non-arrays; normalises + dedupes', () => {
    assert.deepEqual(validatePermissionList([' News.Create ', 'news.create', 'news.update.own']), ['news.create', 'news.update.own']);
    assert.deepEqual(validatePermissionList(['news.*']), ['news.*']);
    assert.throws(() => validatePermissionList(['news.create', 'news.fly']), /Unknown permission/);
    assert.throws(() => validatePermissionList(['*']), /cannot be assigned/);
    assert.throws(() => validatePermissionList('news.create'), /must be an array/);
    assert.throws(() => validatePermissionList(['news.*'], { allowGroupWildcard: false }), /Unknown permission/);
    assert.throws(() => validatePermissionList(['nothing.*']), /Unknown permission/);
});

test('missingFrom blocks privilege escalation (role/user grants must be a subset of the caller)', () => {
    const editor = expand([P.NEWS_CREATE, P.NEWS_UPDATE_ANY]);
    assert.deepEqual(missingFrom([P.NEWS_CREATE], editor), []);
    assert.deepEqual(missingFrom([P.NEWS_CREATE, P.NEWS_PUBLISH], editor), [P.NEWS_PUBLISH]);
    assert.deepEqual(missingFrom(['news.*'], editor).includes(P.NEWS_APPROVE), true);
});
