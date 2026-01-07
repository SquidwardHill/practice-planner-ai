import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "@/components/molecules/login-form";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("LoginForm", () => {
  const mockSignIn = jest.fn();
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });
  });

  it("renders login form with email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows error when login fails", async () => {
    const errorMessage = "Invalid login credentials";
    const error = new Error(errorMessage);
    mockSignIn.mockResolvedValue({
      error,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(emailInput, {
      target: { value: "test@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("redirects to protected route on successful login", async () => {
    mockSignIn.mockResolvedValue({
      error: null,
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/protected");
    });
  });

  it("disables button while loading", async () => {
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ error: null }), 100);
        })
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    const button = screen.getByRole("button", { name: /login/i });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
