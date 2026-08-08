import { test, expect } from "@playwright/test";
import { _formatHashtags } from "../components/bloom.mjs";

test.describe("Bloom Component", () => {
  test("should format a single hashtag in a bloom", () => {
    const text = "Test #do";
    const result = _formatHashtags(text);
    expect(result).toContain('<a href="/hashtag/do">#do</a>');
  });

  test("should format multiple hashtags in a bloom", () => {
    const text = "Tech is magic #blessed #TechLife";
    const result = _formatHashtags(text);
    expect(result).toContain('<a href="/hashtag/blessed">#blessed</a>');
    expect(result).toContain('<a href="/hashtag/TechLife">#TechLife</a>');
  });

  test("should not include word after hashtag that is not a hashtag", () => {
    const text = "Let's get some #SwizBiz love!!";
    const result = _formatHashtags(text);
    expect(result).toContain('<a href="/hashtag/SwizBiz">#SwizBiz</a>');
    expect(result).not.toContain(
      '<a href="/hashtag/SwizBiz">#SwizBiz love!!</a>',
    );
  });
});
