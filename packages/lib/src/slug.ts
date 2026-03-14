export function generateSlug(title: string): string {
  const sanitizedTitle = title
    .toLocaleLowerCase()
    .trim() // remove leading and trailing spaces
    .replace(/[^a-z0-9-\s]/g, '') // sanitizing
    .replace(/^-+/, '') // remove leading hyphens
    .replace(/-+$/, ''); // remove trailing hyphens

  if (!sanitizedTitle) throw new Error('Title must not be empty');
  return (
    sanitizedTitle
      .replace(/\s+/g, '-') // replace spaces with single hyphen
      .replace(/-+/g, '-') + // replace excessive hyphens with single hyphen
    '-' +
    crypto.randomUUID().slice(0, 4)
  );
}
