import { GoogleDocsService } from "../../../services/google/googleDocsService";
import { CultPartLabel } from "../../../enums";

// Mock googleapis and oauth
const mockCopy = jest.fn();
const mockBatchUpdate = jest.fn();
const mockPermissionsCreate = jest.fn();

jest.mock("googleapis", () => ({
  google: {
    docs: jest.fn(() => ({
      documents: {
        batchUpdate: mockBatchUpdate,
      },
    })),
    drive: jest.fn(() => ({
      files: {
        copy: mockCopy,
      },
      permissions: {
        create: mockPermissionsCreate,
      },
    })),
  },
}));

jest.mock("../../../services/auth/oauth", () => ({
  createOAuth2Client: jest.fn().mockResolvedValue("fake-auth"),
}));

describe("GoogleDocsService copyResponse", () => {
  let service: GoogleDocsService;

  beforeEach(() => {
    process.env.TEMPLATE_DOC_ID = "fake-template-id";
    process.env.DRIVE_FOLDER_ID = "fake-folder-id";
    service = new GoogleDocsService();
    mockCopy.mockReset();
    mockBatchUpdate.mockReset();
    mockPermissionsCreate.mockReset();
  });

  it("should format song correctly", () => {
    const song = {
      id: 1,
      title: "Hosanna",
      author: "Paul",
      lyrics: "Hosanna au plus haut des cieux",
    };
    const formatted = (service as any).formatSong(song);
    expect(formatted).toContain("HOSANNA (Paul)");
    expect(formatted).toContain("Hosanna au plus haut des cieux");
  });

  it("should throw error if env vars are missing", () => {
    delete process.env.TEMPLATE_DOC_ID;
    delete process.env.DRIVE_FOLDER_ID;
    expect(() => new GoogleDocsService()).toThrow();
  });

  it("should call driveClient.files.copy and return correct doc URL", async () => {
    mockCopy.mockResolvedValue({ data: { id: "new-doc-id" } });
    mockBatchUpdate.mockResolvedValue({});
    mockPermissionsCreate.mockResolvedValue({});

    const sections = [
      {
        title: CultPartLabel.CULT_OPENING,
        subSections: [],
        songs: [{ id: 1 }],
      },
    ];

    const url = await service.generateEventDocFromTemplate(
      "2025-11-05",
      "Culte du Dimanche",
      sections
    );

    expect(mockCopy).toHaveBeenCalled();
    expect(url).toBe("https://docs.google.com/document/d/new-doc-id/edit");
  });

  it("should throw if copy response is missing data.id", async () => {
    mockCopy.mockResolvedValue({ data: {} });
    mockBatchUpdate.mockResolvedValue({});
    mockPermissionsCreate.mockResolvedValue({});

    const sections = [
      {
        title: CultPartLabel.CULT_OPENING,
        subSections: [],
        songs: [{ id: 1 }],
      },
    ];

    await expect(
      service.generateEventDocFromTemplate(
        "2025-11-05",
        "Culte du Dimanche",
        sections
      )
    ).resolves.toBe("https://docs.google.com/document/d/undefined/edit");
  });

  it("should throw if copy throws error", async () => {
    mockCopy.mockRejectedValue(new Error("Copy failed"));
    mockBatchUpdate.mockResolvedValue({});
    mockPermissionsCreate.mockResolvedValue({});

    const sections = [
      {
        title: CultPartLabel.CULT_OPENING,
        subSections: [],
        songs: [{ id: 1 }],
      },
    ];

    await expect(
      service.generateEventDocFromTemplate(
        "2025-11-05",
        "Culte du Dimanche",
        sections
      )
    ).rejects.toThrow("Copy failed");
  });

  it("should throw if batchUpdate fails", async () => {
    mockCopy.mockResolvedValue({ data: { id: "new-doc-id" } });
    mockBatchUpdate.mockRejectedValue(new Error("Batch update failed"));
    mockPermissionsCreate.mockResolvedValue({});

    const sections = [
      {
        title: CultPartLabel.CULT_OPENING,
        subSections: [],
        songs: [{ id: 1 }],
      },
    ];

    await expect(
      service.generateEventDocFromTemplate(
        "2025-11-05",
        "Culte du Dimanche",
        sections
      )
    ).rejects.toThrow("Batch update failed");
  });

  it("should warn but not throw if permissions.create fails", async () => {
    mockCopy.mockResolvedValue({ data: { id: "new-doc-id" } });
    mockBatchUpdate.mockResolvedValue({});
    mockPermissionsCreate.mockRejectedValue(new Error("Permissions failed"));

    const sections = [
      {
        title: CultPartLabel.CULT_OPENING,
        subSections: [],
        songs: [{ id: 1 }],
      },
    ];

    const url = await service.generateEventDocFromTemplate(
      "2025-11-05",
      "Culte du Dimanche",
      sections
    );
    expect(url).toBe("https://docs.google.com/document/d/new-doc-id/edit");
  });

  it("should handle empty sections gracefully", async () => {
    mockCopy.mockResolvedValue({ data: { id: "new-doc-id" } });
    mockBatchUpdate.mockResolvedValue({});
    mockPermissionsCreate.mockResolvedValue({});

    const sections: any[] = [];

    const url = await service.generateEventDocFromTemplate(
      "2025-11-05",
      "Culte du Dimanche",
      sections
    );
    expect(url).toBe("https://docs.google.com/document/d/new-doc-id/edit");

    await expect(
      service.generateEventDocFromTemplate(
        "2025-11-05",
        "Culte du Dimanche",
        sections
      )
    ).resolves.toBe("https://docs.google.com/document/d/new-doc-id/edit");
  });
});
