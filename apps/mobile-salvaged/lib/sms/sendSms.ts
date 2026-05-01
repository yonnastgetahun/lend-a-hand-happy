import * as SMS from 'expo-sms';
import * as Clipboard from 'expo-clipboard';

export type SendSmsStatus = 'sent' | 'cancelled' | 'copied' | 'unknown';

export type SendSmsResult = {
  status: SendSmsStatus;
};

export type SendSmsParams = {
  phone: string;
  message: string;
};

function mapSmsResult(result: unknown): SendSmsStatus {
  if (result === 'sent' || result === 'cancelled' || result === 'unknown') {
    return result;
  }
  return 'unknown';
}

async function copyToClipboard(message: string): Promise<SendSmsResult> {
  try {
    await Clipboard.setStringAsync(message);
  } catch {
    // Best-effort: still report 'copied' so caller can tell the user
    // to paste/send manually.
  }
  return { status: 'copied' };
}

export async function sendSms({ phone, message }: SendSmsParams): Promise<SendSmsResult> {
  let available = false;
  try {
    available = await SMS.isAvailableAsync();
  } catch {
    available = false;
  }

  if (available) {
    try {
      const response = await SMS.sendSMSAsync([phone], message);
      return { status: mapSmsResult(response?.result) };
    } catch {
      // Composer threw — fall through to clipboard fallback.
    }
  }

  return copyToClipboard(message);
}
