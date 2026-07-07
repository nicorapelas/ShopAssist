import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActionSheetIOS, Alert, Platform, StyleSheet, Text, View } from 'react-native'
import {
  deleteProductPhoto,
  getProductPhotoImageSource,
  uploadProductPhoto,
} from '@/src/api/productPhoto'
import { Btn, FieldLabel, Muted } from '@/src/components/ui'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

type Props = {
  productId: string
  photoRevision: number
  canEdit: boolean
  onPhotoChange: (photoRevision: number, hasPhoto: boolean) => void
}

export function ProductPhotoPanel({ productId, photoRevision, canEdit, onPhotoChange }: Props) {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [revision, setRevision] = useState(photoRevision)
  const [imageSource, setImageSource] = useState<{ uri: string; headers: Record<string, string> } | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setRevision(photoRevision)
  }, [photoRevision])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (revision < 1) {
        setImageSource(null)
        return
      }
      try {
        const src = await getProductPhotoImageSource(productId, revision)
        if (!cancelled) setImageSource(src)
      } catch {
        if (!cancelled) setImageSource(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productId, revision])

  const uploadAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      const mime = asset.mimeType ?? 'image/jpeg'
      const name = asset.fileName ?? (mime.includes('png') ? 'photo.png' : 'photo.jpg')
      setBusy(true)
      try {
        const result = await uploadProductPhoto(productId, asset.uri, mime, name)
        setRevision(result.photoRevision)
        onPhotoChange(result.photoRevision, result.hasPhoto)
      } catch (e) {
        Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload image')
      } finally {
        setBusy(false)
      }
    },
    [onPhotoChange, productId],
  )

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add a catalog image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (!result.canceled && result.assets[0]) {
      await uploadAsset(result.assets[0])
    }
  }, [uploadAsset])

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to photograph this product.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (!result.canceled && result.assets[0]) {
      await uploadAsset(result.assets[0])
    }
  }, [uploadAsset])

  const promptAddImage = useCallback(() => {
    const options = ['Take photo', 'Choose from library', 'Cancel']
    const handlers = [takePhoto, pickFromLibrary, () => {}]

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2, title: revision > 0 ? 'Replace catalog image' : 'Add catalog image' },
        (index) => {
          if (index === 0 || index === 1) void handlers[index]()
        },
      )
      return
    }

    Alert.alert(revision > 0 ? 'Replace image' : 'Add image', undefined, [
      { text: 'Take photo', onPress: () => void takePhoto() },
      { text: 'Photo library', onPress: () => void pickFromLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ])
  }, [pickFromLibrary, revision, takePhoto])

  const removePhoto = useCallback(() => {
    Alert.alert('Remove photo?', 'This removes the catalog image for this product.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true)
            try {
              await deleteProductPhoto(productId)
              setRevision(0)
              setImageSource(null)
              onPhotoChange(0, false)
            } catch (e) {
              Alert.alert('Remove failed', e instanceof Error ? e.message : 'Could not remove photo')
            } finally {
              setBusy(false)
            }
          })()
        },
      },
    ])
  }, [onPhotoChange, productId])

  const hasPhoto = revision > 0

  return (
    <View style={styles.wrap}>
      <FieldLabel>Catalog image</FieldLabel>
      {hasPhoto && imageSource ? (
        <View style={styles.previewWrap}>
          <Image source={imageSource} style={styles.preview} contentFit="contain" accessibilityLabel="Product photo" />
        </View>
      ) : (
        <Muted>No catalog image yet.</Muted>
      )}
      {canEdit ? (
        <View style={styles.actions}>
          <Btn
            label={busy ? 'Uploading…' : hasPhoto ? 'Replace image' : 'Add image'}
            onPress={promptAddImage}
            disabled={busy}
            variant={hasPhoto ? 'ghost' : 'primary'}
          />
          {hasPhoto ? (
            <Btn label="Remove image" onPress={removePhoto} disabled={busy} variant="ghost" />
          ) : null}
        </View>
      ) : (
        <Muted>catalog.write required to add or change images.</Muted>
      )}
      {canEdit ? (
        <Text style={styles.hint}>JPEG, PNG, WebP or GIF. Stored as a square catalog image on the server.</Text>
      ) : null}
    </View>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: 8,
      marginBottom: 8,
    },
    previewWrap: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 280,
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      overflow: 'hidden',
      marginVertical: 8,
    },
    preview: {
      width: '100%',
      height: '100%',
    },
    actions: {
      gap: 0,
      marginTop: 4,
    },
    hint: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 6,
      lineHeight: 16,
    },
  })
}
