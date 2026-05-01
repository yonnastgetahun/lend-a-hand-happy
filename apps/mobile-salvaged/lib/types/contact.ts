/**
 * Contact type used by the lend flow.
 *
 * `source` distinguishes contacts read from the device address book
 * ('device') from those typed in by the user via the manual fallback form
 * ('manual'). Manual contacts are not persisted to the device address book —
 * they live only inside the current lend flow.
 */
export type Contact = {
  id: string;
  name: string;
  phone: string;
  source: 'device' | 'manual';
};
