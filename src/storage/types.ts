export type StorageDriver = "local" | "s3" | "external";

export type SavedFile = {
  key: string; // storage key/path used to locate & delete the file
  url: string; // absolute URL to fetch the file
  driver: StorageDriver;
};

export interface Storage {
  driver: StorageDriver;
  save(buffer: Buffer, filename: string, mimetype: string): Promise<SavedFile>;
  remove(key: string): Promise<void>;
}
