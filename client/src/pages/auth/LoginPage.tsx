import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CONSTANTS } from "@/constants";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { setCredentials } from "@/store/slices/authSlice";
import { useLoginMutation } from "@/services/authApi";
import { authApi } from "@/services/authApi";
import type { AppDispatch } from "@/store";

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required(CONSTANTS.MESSAGES.REQUIRED_FIELD)
    .email(CONSTANTS.MESSAGES.INVALID_EMAIL),
  password: yup
    .string()
    .required(CONSTANTS.MESSAGES.REQUIRED_FIELD)
    .min(6, CONSTANTS.MESSAGES.MIN_LENGTH(6)),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data).unwrap();

      localStorage.setItem(
        CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN,
        response.data.tokens.refreshToken,
      );
      localStorage.setItem(
        CONSTANTS.STORAGE_KEYS.ACCESS_TOKEN,
        response.data.tokens.accessToken,
      );

      try {
        const profileResult = await dispatch(
          authApi.endpoints.getProfile.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap();

        const enrichedUser = profileResult?.data || response.data.user;
        dispatch(
          setCredentials({
            user: enrichedUser,
            accessToken: response.data.tokens.accessToken,
          }),
        );
      } catch (profileErr) {
        console.warn(
          "Profile fetch failed, using globalRole fallback",
          profileErr,
        );
        dispatch(
          setCredentials({
            user: response.data.user,
            accessToken: response.data.tokens.accessToken,
          }),
        );
      }

      navigate("/dashboard");
    } catch (err: unknown) {
      console.error("Login failed", err);
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;

    if (typeof error === "object" && "data" in error) {
      const errorData = error as { data?: { message?: string } };
      return errorData.data?.message || "Login failed";
    }

    return "An unexpected error occurred";
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/40">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-3 text-slate-500 font-medium">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center gap-3">
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
          className="w-full mt-2"
          size="lg"
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </form>

      <div className="text-center mt-8">
        <p className="text-sm text-slate-500 font-medium">
          Don't have an account?{" "}
          <a
            href="/auth/register"
            className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
