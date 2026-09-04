import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationDrawer } from "./NotificationDrawer";
const state = vi.hoisted(() => ({
  sendAnnouncement: vi.fn(),
  isStaff: true,
  profile: { displayName: "テスト" },
}));
vi.mock("../lib/data", () => ({
  useData: () => ({
    ...state,
    announcements: [
      {
        id: "today",
        kind: "notice",
        message: "本日の連絡",
        createdAt: new Date().toISOString(),
        creatorName: "スタッフ",
      },
      {
        id: "old",
        kind: "urgent",
        message: "古い連絡",
        createdAt: "2020-01-01",
        creatorName: "スタッフ",
      },
    ],
  }),
}));
afterEach(cleanup);
describe("通知パネル", () => {
  it("本日の通知だけを表示し、送信を維持する", async () => {
    render(<NotificationDrawer onClose={() => {}} />);
    expect(screen.getByText("本日の連絡")).toBeInTheDocument();
    expect(screen.queryByText("古い連絡")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "お知らせを作成" }));
    fireEvent.change(screen.getByLabelText("お知らせ内容"), {
      target: { value: "営業を開始します" },
    });
    fireEvent.click(screen.getByRole("button", { name: "お知らせを送信" }));
    await waitFor(() =>
      expect(state.sendAnnouncement).toHaveBeenCalledWith(
        "notice",
        "営業を開始します",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("20秒間");
  });
  it("権限のない場合は作成を表示しない", () => {
    state.isStaff = false;
    render(<NotificationDrawer onClose={() => {}} />);
    expect(
      screen.queryByRole("button", { name: "お知らせを作成" }),
    ).not.toBeInTheDocument();
    state.isStaff = true;
  });
});
