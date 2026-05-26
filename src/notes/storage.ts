import AsyncStorage from '@react-native-async-storage/async-storage'
import { Directory, File, Paths } from 'expo-file-system'

const NOTES_KEY = 'shopassist-notes-v1'

export type ShopAssistNoteImage = {
  id: string
  uri: string
}

export type ShopAssistNote = {
  id: string
  text: string
  images: ShopAssistNoteImage[]
  createdAt: string
  updatedAt: string
}

export async function loadNotes(): Promise<ShopAssistNote[]> {
  const raw = await AsyncStorage.getItem(NOTES_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as ShopAssistNote[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveNotes(notes: ShopAssistNote[]): Promise<void> {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export async function persistNoteImage(sourceUri: string): Promise<ShopAssistNoteImage> {
  const id = createId()
  const extension = sourceUri.split('?')[0]?.split('.').pop()?.toLowerCase()
  const safeExtension = extension && extension.length <= 5 ? extension : 'jpg'
  const dir = new Directory(Paths.document, 'shopassist-notes')
  dir.create({ idempotent: true, intermediates: true })
  const destination = new File(dir, `${id}.${safeExtension}`)
  new File(sourceUri).copy(destination)
  return { id, uri: destination.uri }
}

export async function deleteNoteImages(images: ShopAssistNoteImage[]): Promise<void> {
  await Promise.all(
    images.map(async (image) => {
      try {
        new File(image.uri).delete()
      } catch {
        // Image cleanup should never block note deletion.
      }
    }),
  )
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
