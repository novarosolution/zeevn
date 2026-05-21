import { act, renderHook } from "@testing-library/react-native";
import useHomeFilters from "../../src/screens/home/hooks/useHomeFilters";

function buildProduct({ id, name, homeSection = "Prime Products" }) {
  return {
    id,
    name,
    description: `${name} description`,
    category: "Essentials",
    productType: "Essentials",
    homeSection,
    showOnHome: true,
  };
}

describe("useHomeFilters prime section visibility", () => {
  it("hides prime section when no prime products exist", () => {
    const { result } = renderHook(() =>
      useHomeFilters({
        products: [buildProduct({ id: "1", name: "Classic Rice", homeSection: "Daily Staples" })],
        homeViewConfig: { showPrimeSection: true, primeSectionTitle: "Prime Products" },
      })
    );

    expect(result.current.showPrimeSection).toBe(false);
  });

  it("shows prime section when at least one prime product exists", () => {
    const { result } = renderHook(() =>
      useHomeFilters({
        products: [buildProduct({ id: "2", name: "Prime Ghee", homeSection: "Prime Products" })],
        homeViewConfig: { showPrimeSection: true, primeSectionTitle: "Prime Products" },
      })
    );

    expect(result.current.showPrimeSection).toBe(true);
  });

  it("hides prime section while an active search query exists", () => {
    const { result } = renderHook(() =>
      useHomeFilters({
        products: [buildProduct({ id: "3", name: "Prime Honey", homeSection: "Prime Products" })],
        homeViewConfig: { showPrimeSection: true, primeSectionTitle: "Prime Products" },
      })
    );

    act(() => {
      result.current.setQuery("honey");
    });

    expect(result.current.showPrimeSection).toBe(false);
  });
});

