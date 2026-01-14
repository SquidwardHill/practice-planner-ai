import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ForgotPasswordForm } from "@/components/molecules/forgot-password-form";
import { createClient } from "@/lib/supabase/client";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

describe("ForgotPasswordForm", () => {
  const mockResetPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPassword,
      },
    });
  });

  it("renders password reset form with email field", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reset email/i })
    ).toBeInTheDocument();
  });

  it("shows success message after successful password reset request", async () => {
    mockResetPassword.mockResolvedValue({
      error: null,
    });

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset email/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(
        screen.getByText(/password reset instructions sent/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error when password reset request fails", async () => {
    const errorMessage = "User not found";
    const error = new Error(errorMessage);
    mockResetPassword.mockResolvedValue({
      error,
    });

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "nonexistent@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset email/i }));

    await waitFor(
      () => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("calls resetPasswordForEmail with correct email and redirect URL", async () => {
    mockResetPassword.mockResolvedValue({
      error: null,
    });

    // Since jsdom doesn't allow redefining location properties easily,
    // we'll verify that resetPasswordForEmail is called with a redirect URL
    // that matches the pattern (origin + /auth/update-password)
    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset email/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("test@example.com", expect.objectContaining({
        redirectTo: expect.stringMatching(/\/auth\/update-password$/),
      }));
    });
  });

  it("disables button while loading", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockResetPassword.mockImplementation(() => promise);

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });

    const button = screen.getByRole("button", { name: /send reset email/i });
    fireEvent.click(button);

    // Button should be disabled while loading
    expect(button).toBeDisabled();
    expect(screen.getByText(/sending/i)).toBeInTheDocument();

    // Resolve the promise to complete the loading state
    // Note: After success, the form shows a success message and the button is no longer visible
    // So we just verify it was disabled during loading
    resolvePromise!({ error: null });

    await waitFor(() => {
      // After success, the form shows success message, button is replaced
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });
});
