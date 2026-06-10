import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

function getRoleKey(user: NonNullable<TrpcContext["user"]>) {
  return (user as any).roleKey ?? (user.role === "admin" ? "admin" : null);
}

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const status = (ctx.user as any).status ?? "Active";
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

    const status = (ctx.user as any).status ?? "Active";
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
      const status = (ctx.user as any).status ?? "Active";
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
