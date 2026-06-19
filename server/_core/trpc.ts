import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { AuthSessionUser, TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const zodError = error.cause && typeof error.cause === "object" && "flatten" in error.cause
      ? (error.cause as { flatten: () => unknown }).flatten()
      : null;

    return {
      ...shape,
      message: userFriendlyErrorMessage(error.code, shape.message),
      data: {
        ...shape.data,
        zodError,
        sprint177: true,
      },
    };
  },
});

function userFriendlyErrorMessage(code: string, fallback: string) {
  switch (code) {
    case "UNAUTHORIZED":
      return "Login required. Please sign in again.";
    case "FORBIDDEN":
      return fallback || "You do not have permission for this action.";
    case "NOT_FOUND":
      return "Requested record was not found.";
    case "CONFLICT":
      return "This record already exists or conflicts with another workflow action.";
    case "PRECONDITION_FAILED":
      return fallback || "This workflow action cannot be completed yet.";
    case "BAD_REQUEST":
      return fallback || "Invalid input. Please review highlighted fields.";
    default:
      return fallback || "Unexpected system error. Please try again or contact the SBTS administrator.";
  }
}

export const router = t.router;
export const publicProcedure = t.procedure;

function getRoleKey(user: AuthSessionUser) {
  return user.roleKey ?? (user.role === "admin" ? "admin" : null);
}

function getUserStatus(user: AuthSessionUser) {
  return user.status ?? "Active";
}

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const status = getUserStatus(ctx.user);
  if (status !== "Active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account is pending admin approval or inactive.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    const status = getUserStatus(ctx.user);
    if (status !== "Active") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your account is pending admin approval or inactive.",
      });
    }

    if (getRoleKey(ctx.user) !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export function roleProcedure(allowedRoleKeys: string[]) {
  return t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      }
      const status = getUserStatus(ctx.user);
      if (status !== "Active") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your account is pending admin approval or inactive.",
        });
      }
      const roleKey = getRoleKey(ctx.user);
      if (!roleKey || !allowedRoleKeys.includes(roleKey)) {
        throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
      }
      return next({ ctx: { ...ctx, user: ctx.user } });
    })
  );
}

export const coordinatorProcedure = roleProcedure(["admin", "coordinator"]);
export const supervisorProcedure = roleProcedure(["admin", "coordinator", "tiEngineer", "metalForeman"]);
