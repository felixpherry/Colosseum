export function generateSlug(title: string): string {
  return (
    title
      .toLocaleLowerCase()
      .trim() // remove leading and trailing spaces
      .replace(/[^a-z0-9-\s]/g, '') // sanitizing
      .replace(/^-+/, '') // remove leading hyphens
      .replace(/-+$/, '') // remove trailing hyphens
      .replace(/\s+/g, '-') // replace spaces with single hyphen
      .replace(/-+/g, '-') + // replace excessive hyphens with single hyphen
    '-' +
    crypto.randomUUID().slice(0, 4)
  );
}
