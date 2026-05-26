import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Btn, ErrorText, Input, Loading, Muted, Screen } from '@/src/components/ui'
import { SessionBar } from '@/src/components/SessionBar'
import {
  createId,
  deleteNoteImages,
  loadNotes,
  persistNoteImage,
  saveNotes,
  type ShopAssistNote,
  type ShopAssistNoteImage,
} from '@/src/notes/storage'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

export default function NotesScreen() {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [notes, setNotes] = useState<ShopAssistNote[]>([])
  const [text, setText] = useState('')
  const [images, setImages] = useState<ShopAssistNoteImage[]>([])
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = useMemo(() => text.trim().length > 0 || images.length > 0, [images.length, text])

  useEffect(() => {
    void (async () => {
      try {
        setNotes(await loadNotes())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load notes')
      } finally {
        setBusy(false)
      }
    })()
  }, [])

  async function replaceNotes(next: ShopAssistNote[]) {
    setNotes(next)
    await saveNotes(next)
  }

  async function addPickedImages(assets: ImagePicker.ImagePickerAsset[]) {
    setSaving(true)
    setError(null)
    try {
      const persisted = await Promise.all(assets.map((asset) => persistNoteImage(asset.uri)))
      setImages((prev) => [...prev, ...persisted])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not attach image')
    } finally {
      setSaving(false)
    }
  }

  async function chooseImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (!result.canceled) await addPickedImages(result.assets)
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      setError('Camera permission is needed to take note photos.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!result.canceled) await addPickedImages(result.assets)
  }

  async function saveNote() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const note: ShopAssistNote = {
        id: createId(),
        text: text.trim(),
        images,
        createdAt: now,
        updatedAt: now,
      }
      await replaceNotes([note, ...notes])
      setText('')
      setImages([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save note')
    } finally {
      setSaving(false)
    }
  }

  async function removeDraftImage(image: ShopAssistNoteImage) {
    setImages((prev) => prev.filter((item) => item.id !== image.id))
    await deleteNoteImages([image])
  }

  function confirmDeleteNote(note: ShopAssistNote) {
    Alert.alert('Delete note?', 'This note and its images will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const next = notes.filter((item) => item.id !== note.id)
            await replaceNotes(next)
            await deleteNoteImages(note.images)
          })()
        },
      },
    ])
  }

  return (
    <Screen style={styles.screen}>
      <SessionBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.composer}>
            <View style={styles.composerHeader}>
              <View style={styles.composerIcon}>
                <Ionicons name="create-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.composerTitleWrap}>
                <Text style={styles.title}>Capture a note</Text>
                <Text style={styles.copy}>Add quick shop-floor notes with optional images.</Text>
              </View>
            </View>

            <Input
              value={text}
              onChangeText={setText}
              placeholder="Type your note..."
              multiline
              textAlignVertical="top"
              style={styles.noteInput}
            />

            {images.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageStrip}>
                {images.map((image) => (
                  <View key={image.id} style={styles.draftImageWrap}>
                    <Image source={{ uri: image.uri }} style={styles.draftImage} contentFit="cover" />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove image"
                      onPress={() => void removeDraftImage(image)}
                      style={styles.removeImageButton}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {error ? <ErrorText>{error}</ErrorText> : null}

            <View style={styles.actionRow}>
              <Btn
                compact
                variant="ghost"
                accessibilityLabel="Choose image"
                icon={<Ionicons name="images-outline" size={24} color={colors.text} />}
                onPress={() => void chooseImages()}
                disabled={saving}
              />
              <Btn
                compact
                variant="ghost"
                accessibilityLabel="Take photo"
                icon={<Ionicons name="camera-outline" size={24} color={colors.text} />}
                onPress={() => void takePhoto()}
                disabled={saving}
              />
            </View>
            <Btn
              label={saving ? 'Saving...' : 'Save note'}
              onPress={() => void saveNote()}
              disabled={!canSave || saving}
            />
          </View>

          <View style={styles.notesHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.noteCount}>{notes.length}</Text>
          </View>

          {busy ? <Loading /> : null}
          {!busy && !notes.length ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={28} color={colors.muted} />
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Muted>Saved notes stay on this device for quick reference.</Muted>
            </View>
          ) : null}

          {notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteTopRow}>
                <Text style={styles.noteDate}>{new Date(note.createdAt).toLocaleString()}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete note"
                  onPress={() => confirmDeleteNote(note)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
              {note.text ? <Text style={styles.noteText}>{note.text}</Text> : null}
              {note.images.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageStrip}>
                  {note.images.map((image) => (
                    <Image key={image.id} source={{ uri: image.uri }} style={styles.savedImage} contentFit="cover" />
                  ))}
                </ScrollView>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
  screen: {
    padding: 0,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  composer: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },
  composerHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  composerIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerTitleWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  copy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  noteInput: {
    minHeight: 112,
    borderRadius: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageStrip: {
    gap: 10,
    paddingVertical: 12,
  },
  draftImageWrap: {
    position: 'relative',
  },
  draftImage: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: colors.bg,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15,23,42,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  noteCount: {
    minWidth: 28,
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.inputBg,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyCard: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  noteDate: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  savedImage: {
    width: 116,
    height: 116,
    borderRadius: 16,
    backgroundColor: colors.bg,
  },
})
}
