import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFile, deleteFile, getFileUrl } from "../utils/storageService.js";
import { v4 as uuidv4 } from 'uuid';

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    console.log("Upload failed: No file in req.file");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    throw new ApiError(400, "No file uploaded. Ensure you're sending a 'file' field in multipart/form-data.");
  }

  const { buffer, originalname, mimetype, size } = req.file;
  const extension = originalname.split('.').pop();
  const filename = `${uuidv4()}.${extension}`;
  
  // Determine type
  let type = 'document';
  if (mimetype.startsWith('image/')) type = 'image';
  else if (mimetype.startsWith('video/')) type = 'video';

  // Upload to storage
  const key = await uploadFile(buffer, filename, { contentType: mimetype });
  const url = getFileUrl(key);

  // Get active provider from config
  const storageConfig = await prisma.storageConfig.findFirst();
  const provider = storageConfig?.activeProvider || 'unknown';

  // Save to database
  const media = await prisma.media.create({
    data: {
      url,
      key,
      name: originalname,
      type,
      mimeType: mimetype,
      size,
      provider,
    }
  });

  res.status(201).json(new ApiResponsive(201, media, "Media uploaded successfully"));
});

export const listMedia = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 20, search } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (type && type !== 'all') where.type = type;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [total, media] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    })
  ]);

  // Dynamically update URLs in case config changed
  const formattedMedia = media.map(item => ({
    ...item,
    url: getFileUrl(item.key)
  }));

  res.status(200).json(new ApiResponsive(200, {
    media: formattedMedia,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  }, "Media list fetched"));
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    throw new ApiError(404, "Media not found");
  }

  // Delete from storage
  try {
      await deleteFile(media.key);
  } catch (error) {
      console.warn("Storage delete failed, continuing with DB delete:", error.message);
  }

  // Delete from database
  await prisma.media.delete({ where: { id } });

  res.status(200).json(new ApiResponsive(200, {}, "Media deleted successfully"));
});
