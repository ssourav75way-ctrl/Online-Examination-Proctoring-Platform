import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { CONSTANTS, ROLES } from "@/constants";
import { Role } from "@/types/auth";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { apiSlice } from "@/services/api";

const registerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerAccount: builder.mutation<
      { success: boolean; message: string; data: { id: string } },
      Record<string, string>
    >({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
  }),
});

const { useRegisterAccountMutation } = registerApi;

const registerSchema = yup.object().shape({
  email: yup
    .string()
    .required(CONSTANTS.MESSAGES.REQUIRED_FIELD)
    .email(CONSTANTS.MESSAGES.INVALID_EMAIL),
  password: yup
    .string()
    .required(CONSTANTS.MESSAGES.REQUIRED_FIELD)
    .min(6, CONSTANTS.MESSAGES.MIN_LENGTH(6)),
  firstName: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
  lastName: yup.string().required(CONSTANTS.MESSAGES.REQUIRED_FIELD),
});

type RegisterFormData = yup.InferType<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [registerAccount, { isLoading, error, isSuccess }] =
    useRegisterAccountMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerAccount({ ...data, globalRole: ROLES.CANDIDATE }).unwrap();
    } catch (err: unknown) {
      console.error("Registration failed", err);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    if (typeof error === "object" && "data" in error) {
      const errorData = error as { data?: { message?: string } };
      return errorData.data?.message || "Registration failed";
    }
    return "An unexpected error occurred";
  };

  const errorMessage = getErrorMessage();

  if (isSuccess) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-main">
          Registration Successful
        </h2>
        <p className="text-text-muted">
          Your account has been created successfully. You can now log in.
        </p>
        <div className="pt-4">
          <Button onClick={() => navigate("/auth/login")} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/40">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Account
        </h2>
        <p className="mt-3 text-slate-500 font-medium">
          Register to access the online assessment platform
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <Input
            label="First Name"
            id="firstName"
            placeholder="John"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label="Last Name"
            id="lastName"
            placeholder="Doe"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <Input
          label="Email Address"
          id="email"
          type="email"
          placeholder="you@institution.edu"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
          id="password"
          type="password"
          placeholder=""
          error={errors.password?.message}
          {...register("password")}
        />

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium mt-4 flex items-center gap-3">
            <svg
              className="w-5 h-5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-4"
          size="lg"
          isLoading={isLoading}
        >
          Create Account
        </Button>

        <div className="text-center mt-8 pb-2">
          <p className="text-sm text-slate-500 font-medium">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default RegisterPage;
