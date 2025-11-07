const mockBatchUpdate = jest.fn();
const mockCopy = jest.fn();
const mockPermissionsCreate = jest.fn();

export const google = {
  docs: jest.fn(() => ({
    documents: {
      batchUpdate: mockBatchUpdate,
    },
  })),
  drive: jest.fn(() => ({
    files: { copy: mockCopy },
    permissions: { create: mockPermissionsCreate },
  })),
};

export { mockBatchUpdate, mockCopy, mockPermissionsCreate };
