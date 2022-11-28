import { withMessage } from "io-ts-types/withMessage";
import * as t from "io-ts";

export interface PasswordBrand {
  readonly Password: unique symbol;
}

export const SPECIAL_CHARS = /[=+^$*.\[\]{}()?"!@#%&/\\,><':;|_~`-]/;

export const Password = withMessage(
  t.brand(
    t.string,
    (s: string): s is t.Branded<string, PasswordBrand> =>
      // https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-policies.html
      s.length >= 12 && // minimum length
      s.length <= 99 && // maximum length
      new RegExp(`^([A-Za-z0-9]|${SPECIAL_CHARS.source})+$`).test(s) && // only allow uppercase and lowercase letters, numbers and specific special characters (Cognito limitation)
      /[A-Z]/.test(s) && // at least one uppercase letter
      /[a-z]/.test(s) && // at least one lowercase letter
      /[0-9]/.test(s) && // at least one number
      SPECIAL_CHARS.test(s), // at least one predefined special character
    "Password"
  ),
  () =>
    "Password must be 12-99 characters long, have at least one lowercase and uppercase letter, one number, and one special character, and must only contain letters, numbers, and special characters. Allowed special characters: = + - ^ $ * . [ ] { } ( ) ? \" ! @ # % & / \\ , > < ' : ; | _ ~ `"
);
