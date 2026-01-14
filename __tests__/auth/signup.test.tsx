import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignUpForm } from "@/components/molecules/sign-up-form";
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

describe("SignUpForm", () => {
  const mockSignUp = jest.fn();
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });
  });

  it("renders signup form with all required fields", () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/repeat password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/repeat password/i), {
      target: { value: "differentpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows error when signup fails", async () => {
    const errorMessage = "User already registered";
    const error = new Error(errorMessage);
    mockSignUp.mockResolvedValue({
      error,
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/repeat password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(
      () => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("redirects to welcome page when user is already confirmed", async () => {
    mockSignUp.mockResolvedValue({
      error: null,
      data: {
        user: {
          email_confirmed_at: new Date().toISOString(),
        },
      },
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/repeat password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/welcome");
    });
  });

  it("redirects to success page when email confirmation is required", async () => {
    mockSignUp.mockResolvedValue({
      error: null,
      data: {
        user: {
          email_confirmed_at: null,
        },
      },
    });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/repeat password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/auth/sign-up-success");
    });
  });
});
