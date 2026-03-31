/**
 * Maps a source file's extension based on whether it contains JSX.
 *
 * @param containsJsx - Whether the file contains JSX syntax
 * @returns ".tsx" if containsJsx is true, ".ts" otherwise
 */
export function mapExtension(containsJsx: boolean): string {
  return containsJsx ? ".tsx" : ".ts"
}
