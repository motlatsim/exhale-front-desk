const helpers = require('../src/helpers');

describe('helpers.timeAgo', () => {
  const realNow = Date.now;
  afterEach(() => { Date.now = realNow; });

  test('returns just now for recent timestamps', () => {
    const fixed = new Date('2026-08-10T12:00:00Z').getTime();
    Date.now = () => fixed + 30 * 1000; // 30s later
    expect(helpers.timeAgo('2026-08-10T12:00:00Z')).toBe('just now');
  });

  test('returns minutes and hours and days appropriately', () => {
    const fixed = new Date('2026-08-10T12:00:00Z').getTime();
    Date.now = () => fixed + 5 * 60 * 1000; // 5 minutes later
    expect(helpers.timeAgo('2026-08-10T12:00:00Z')).toBe('5m ago');

    Date.now = () => fixed + 2 * 60 * 60 * 1000; // 2 hours later
    expect(helpers.timeAgo('2026-08-10T12:00:00Z')).toBe('2h ago');

    Date.now = () => fixed + 3 * 24 * 60 * 60 * 1000; // 3 days later
    expect(helpers.timeAgo('2026-08-07T12:00:00Z')).toBe('3d ago');
  });
});

describe('helpers.cleanStageName', () => {
  test('removes emoji and trims', () => {
    expect(helpers.cleanStageName('\ud83c\udf31 New Enquiry')).toBe('New Enquiry');
    expect(helpers.cleanStageName('  Hello  ')).toBe('Hello');
  });
});
