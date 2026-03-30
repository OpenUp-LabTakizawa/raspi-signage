import { supabase } from "../src/supabase/client"
import { supabaseAdmin } from "../src/supabase/server"

export const setContentData = async (_content) => {
  // Legacy: contents/group0/src - not actively used in current flow
  // Kept for compatibility
}

// Update content order (including delete)
export const setContentOrder = async (docId, content) => {
  await supabase.from("orders").upsert({ id: docId, ...content })
}

// Register content
export const updateContentOrder = async (docId, content) => {
  await supabase.from("orders").update(content).eq("id", docId)
}

// Register or retrieve CSS pixel size for content
export const setContentPixelSize = async (
  orderId,
  pixelSizeId,
  width,
  height,
) => {
  if (pixelSizeId === "") {
    const pixelSize = {
      width,
      height,
      pixel_width: width,
      pixel_height: height,
      margin_top: 0,
      margin_left: 0,
      display_content_flg: true,
      get_pixel_flg: false,
    }
    const { data: newPixel } = await supabase
      .from("pixel_sizes")
      .insert(pixelSize)
      .select()
      .single()

    await supabase
      .from("contents")
      .update({ pixel_size_id: newPixel.id })
      .eq("order_id", orderId)

    return {
      width,
      height,
      pixelWidth: width,
      pixelHeight: height,
      marginTop: 0,
      marginLeft: 0,
      displayContentFlg: true,
      getPixelFlg: false,
    }
  }

  const { data } = await supabase
    .from("pixel_sizes")
    .select()
    .eq("id", pixelSizeId)
    .single()
  if (!data) {
    return null
  }

  const pixelSize = {
    width: data.width,
    height: data.height,
    pixelWidth: data.pixel_width,
    pixelHeight: data.pixel_height,
    marginTop: data.margin_top,
    marginLeft: data.margin_left,
    displayContentFlg: data.display_content_flg,
    getPixelFlg: data.get_pixel_flg,
  }

  if (!data.get_pixel_flg) {
    await supabase
      .from("pixel_sizes")
      .update({
        pixel_width: width,
        pixel_height: height,
        get_pixel_flg: false,
      })
      .eq("id", pixelSizeId)
  }
  return pixelSize
}

// Initial setup for display adjustment screen
export const createDisplayContent = async (orderId, pixel) => {
  const pixelSize = {
    width: 0,
    height: 0,
    pixel_width: pixel.pixelWidth,
    pixel_height: pixel.pixelHeight,
    margin_top: 0,
    margin_left: 0,
    display_content_flg: true,
    get_pixel_flg: false,
  }
  const { data: newPixel } = await supabase
    .from("pixel_sizes")
    .insert(pixelSize)
    .select()
    .single()

  await supabase
    .from("contents")
    .update({ pixel_size_id: newPixel.id })
    .eq("order_id", orderId)

  return {
    ...pixel,
    width: 0,
    height: 0,
    marginTop: 0,
    marginLeft: 0,
    displayContentFlg: true,
    getPixelFlg: false,
  }
}

// Update display adjustment parameters
export const updateDisplayContent = async (
  pixelSizeId,
  height,
  width,
  marginTop,
  marginLeft,
) => {
  await supabase
    .from("pixel_sizes")
    .update({
      height,
      width,
      margin_top: marginTop,
      margin_left: marginLeft,
    })
    .eq("id", pixelSizeId)
}

// Unlock CSS pixel size for re-acquisition on Raspberry Pi signage display
export const resetPixelSize = async (pixelSizeId) => {
  await supabase
    .from("pixel_sizes")
    .update({ get_pixel_flg: true })
    .eq("id", pixelSizeId)
}

// Add area in area management
export const createContentsData = async (areaName) => {
  const { data: newOrder } = await supabase
    .from("orders")
    .insert({ set1: [], hidden: [] })
    .select()
    .single()

  const { count } = await supabase
    .from("contents")
    .select("*", { count: "exact", head: true })

  await supabase.from("contents").insert({
    area_name: areaName,
    order_id: newOrder.id,
    area_id: (count ?? 0).toString(),
    deleted: false,
  })
}

// Edit area in area management
export const updateContentsData = async (index, contents, areaName) => {
  const orderId = contents[index].orderId
  await supabase
    .from("contents")
    .update({ area_name: areaName })
    .eq("order_id", orderId)
}

// Delete area in area management
export const deleteContentsData = async (index, contents) => {
  const orderId = contents[index].orderId
  await supabase
    .from("contents")
    .update({ deleted: true })
    .eq("order_id", orderId)
}

// Create account in account management
export const createAccountData = async (email, password, user) => {
  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) {
    console.log("登録されています")
    return
  }

  await supabaseAdmin.from("users").insert({
    id: authData.user.id,
    email,
    user_name: user.userName,
    management: user.management,
    coverage_area: user.coverageArea,
    pass_flg: user.passFlg ?? true,
    deleted: false,
  })
}

// Edit account in account management
export const updateAccountData = async (
  uid,
  user,
  email,
  nowPassword,
  newPassword,
) => {
  if (newPassword) {
    // Re-authenticate then update password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: nowPassword,
    })
    if (signInError) {
      console.log(signInError)
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (updateError) {
      console.log(updateError)
      return
    }
  }

  await supabase
    .from("users")
    .update({
      user_name: user.userName,
      management: user.management,
      coverage_area: user.coverageArea,
    })
    .eq("id", uid)
}

// Delete account in account management
export const deleteAccountData = async (uid) => {
  await supabase.from("users").update({ deleted: true }).eq("id", uid)
}

// Reset account password in account management
export const resetAccountPassword = async (uid, newPassword) => {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
    password: newPassword,
  })
  if (error) {
    console.log(error)
    return
  }

  await supabaseAdmin.from("users").update({ pass_flg: true }).eq("id", uid)
}
