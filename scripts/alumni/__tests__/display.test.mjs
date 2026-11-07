import test from 'node:test';
import assert from 'node:assert/strict';
import { gradYear, classStatus, majorsOf, formatPhone, uniqueCaseInsensitive, safeLinkedInUrl } from '../../../utils/alumni.js';

test('gradYear tolerates the junk found in Brothers.year', () => {
  assert.equal(gradYear('2026('), 2026);
  assert.equal(gradYear('202'), null);
  assert.equal(gradYear(null), null);
});

test('classStatus: this year\'s class is alumni once spring commencement has passed', () => {
  assert.equal(classStatus('2026', new Date(2026, 9, 29)), 'alumni');
  assert.equal(classStatus('2026', new Date(2026, 2, 15)), 'current');
  assert.equal(classStatus('2026', new Date(2026, 5, 1)), 'alumni');
  assert.equal(classStatus('2027', new Date(2026, 9, 29)), 'current');
  assert.equal(classStatus('2025', new Date(2026, 2, 15)), 'alumni');
  assert.equal(classStatus('202', new Date(2026, 9, 29)), 'unknown');
});

test('majorsOf spells majors out and splits multiple majors', () => {
  assert.deepEqual(majorsOf('MechE'), ['Mechanical Engineering']);
  assert.deepEqual(majorsOf('Mech E & CS'), ['Mechanical Engineering', 'Computer Science']);
  assert.deepEqual(majorsOf('CE, EP'), ['Computer Engineering', 'Engineering Physics']);
  assert.deepEqual(majorsOf('DataSci and IOE'), ['Data Science', 'Industrial and Operations Engineering']);
  assert.deepEqual(majorsOf('CS & Honors Math'), ['Computer Science', 'Mathematics']);
  assert.deepEqual(majorsOf('Matscie'), ['Materials Science and Engineering']);
  assert.deepEqual(majorsOf('Areo'), ['Aerospace Engineering']);
  assert.deepEqual(majorsOf('Civil'), ['Civil and Environmental Engineering']);
  assert.deepEqual(majorsOf('CSE'), ['Computer Science']);
  assert.deepEqual(majorsOf('Rob'), ['Robotics']);
});

test('majorsOf keeps "and" inside full names and inside parentheses', () => {
  assert.deepEqual(majorsOf('Materials Science and Engineering'), ['Materials Science and Engineering']);
  assert.deepEqual(majorsOf('Industrial and Operations Engineering and CS'), ['Industrial and Operations Engineering', 'Computer Science']);
  assert.deepEqual(majorsOf('BGS (Marketing Strategy and Operations)'), ['BGS (Marketing Strategy and Operations)']);
  assert.deepEqual(majorsOf('Engineering undeclared'), ['Undeclared Engineering']);
  assert.deepEqual(majorsOf('statistics'), ['Statistics']);
  assert.deepEqual(majorsOf(null), []);
});

test('formatPhone formats US numbers and leaves others alone', () => {
  assert.deepEqual(formatPhone('7345551234'), { display: '(734) 555-1234', tel: '+17345551234' });
  assert.deepEqual(formatPhone('+1 (734) 555-1234'), { display: '(734) 555-1234', tel: '+17345551234' });
  assert.deepEqual(formatPhone('734.555.1234 ext 22'), { display: '(734) 555-1234 x22', tel: '+17345551234' });
  assert.equal(formatPhone('+44 20 7946 0958').display, '+44 20 7946 0958');
  assert.deepEqual(formatPhone(null), { display: '', tel: '' });
});

test('uniqueCaseInsensitive and safeLinkedInUrl', () => {
  assert.deepEqual(uniqueCaseInsensitive(['Google', 'google ', ' Apple', '']), ['Apple', 'Google']);
  assert.equal(safeLinkedInUrl('javascript:alert(1)'), null);
  assert.equal(safeLinkedInUrl('linkedin.com/in/jane'), 'https://linkedin.com/in/jane');
});

import { initialsOf, uniqnamesWithPhotos } from '../../../utils/alumni.js';

test('initialsOf and uniqnamesWithPhotos', () => {
  assert.equal(initialsOf('jane', 'doe'), 'JD');
  assert.equal(initialsOf('', undefined), '?');
  const map = uniqnamesWithPhotos([
    { name: 'jadono.jpeg', updated_at: '2026-11-04T06:09:31Z' },
    { name: 'x.JPG', created_at: '2026-01-01' },
    { name: '.emptyFolderPlaceholder' }, null,
  ]);
  assert.deepEqual([...map.keys()].sort(), ['jadono', 'x']);
  assert.equal(map.get('jadono'), '2026-11-04T06:09:31Z'); // version changes when the photo is re-uploaded
  assert.equal(map.get('x'), '2026-01-01');
});
