export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
      <p className="mt-2 text-sm text-gray-600">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>
      <form className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Send reset link
        </button>
        <a href="/login" className="block text-center text-sm text-gray-600 hover:underline">
          Back to sign in
        </a>
      </form>
    </div>
  );
}
