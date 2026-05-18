import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import SessionExpiryRedirect from "../SessionExpiryRedirect";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("../../context/AuthContext");

describe("SessionExpiryRedirect", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("redirects to Login with sessionExpired when session expired", async () => {
    useAuth.mockReturnValue({
      sessionExpired: true,
      isAuthenticated: false,
      isAuthLoading: false,
    });

    render(<SessionExpiryRedirect />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Login", { sessionExpired: true });
    });
  });

  test("does not redirect while loading", () => {
    useAuth.mockReturnValue({
      sessionExpired: true,
      isAuthenticated: false,
      isAuthLoading: true,
    });

    render(<SessionExpiryRedirect />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
