import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Shared access-control statement + roles, imported by BOTH the server
 * auth instance (src/lib/auth.ts) and the client (src/lib/auth-client.ts)
 * so the two sides agree on what each role can do.
 *
 * Three roles:
 * - user:     customer, no admin-panel capabilities at all.
 * - employee: baseline admin-panel capabilities, but explicitly no
 *             account-management actions on the `user` resource.
 * - owner:    full admin-panel capabilities PLUS full account management
 *             on the `user` resource.
 */
export const statement = defaultStatements;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  user: [],
  session: [],
});

export const employee = ac.newRole({
  ...adminAc.statements,
  user: [],
  session: [],
});

export const owner = ac.newRole({
  ...adminAc.statements,
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "get",
    "update",
  ],
});

/**
 * True if the given role may access the admin panel (/admin/*).
 * Mirrors the /admin/* gate in src/middleware.ts. Kept here so the
 * client admin-login page and the middleware agree on one definition.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "owner" || role === "employee";
}
