// dependencies
import { createClient } from '@supabase/supabase-js';
import { config } from "dotenv";

config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLIC_KEY);

const doLogin = async () => {

    const { data: user, error: userErr } = await supabase.auth.signInWithPassword({
        email: process.env.SUPABASE_USER,
        password: process.env.SUPABASE_PASS,
    });

    userErr && console.log("Login error: ", userErr);
    console.log(user.session.access_token);
}

const getCardIds = async () => {
    const { data, error } = await supabase.from('card').select("id, image").is("image", null);
    error && console.log("Card fetch error: ", error);
    const noImageCards = data.map(card => card.id);

    return noImageCards;
}

const uploadImage = async (id) => {
    // Gets the image data
    const cardURL = process.env.YGOPD_IMAGE_BASE + id + ".jpg";
    const response = await fetch(cardURL);
    const blob = await response.blob();
    const file = new File([blob], `${id}.jpg`, { type: blob.type });
    console.log("File being uploaded: ", file);

    // Uploads the file to the bucket
    const { data: uploadData, error: uploadError } = await supabase.storage.from('CardImages')
        .upload(`${id}.jpg`, file, { cacheControl: '3600', upsert: true });

    console.log("File uploaded: ", uploadData);
    console.log("File uploaded id: ", uploadData?.id);
    uploadError && console.log("File upload error: ", uploadError);
    let idToUse = uploadData?.id;

    if (!idToUse) {
        const { data: existingImgData, error: existingImgError } = await supabase.storage.from('CardImages')
            .list('', {
                limit: 1,
                offset: 0,
                search: `${id}.jpg`
            });

        console.log("Existing card: ", existingImgData?.[0])
        existingImgError && console.log("Existing card error: ", existingImgError);
        
        if (existingImgData?.[0].id) {
            idToUse = existingImgData?.[0].id;
        }
    }

    if (idToUse) {
        // Updates the card with the image id
        const { data: updateData, error: updateError } = await supabase.from('card')
            .update({ image: idToUse }).eq('id', id).select();

        console.log("Card updated: ", updateData);
        updateError && console.log("Card update error: ", updateError);
    } else {
        console.log("Couldnt upload card: " + id);
    }
}

export const executeCheck = async () => {
    await doLogin();
    const cardIds = await getCardIds();
    cardIds.forEach(uploadImage);
    return Promise.resolve({ success: true });
}
