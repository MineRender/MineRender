export interface ArchiveEntry {
    filename: string;
    getData(): Promise<Blob>;
}