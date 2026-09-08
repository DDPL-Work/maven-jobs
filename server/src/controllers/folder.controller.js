const Folder = require("../models/Folder");
const FolderCandidate = require("../models/FolderCandidate");
const CandidateProfile = require("../models/CandidateProfile");
const User = require("../models/User");
const createHttpError = require("http-errors");
const asyncHandler = require("../middleware/async.middleware");
const activityService = require("../services/recruiter-activity.service");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// GET /folders
exports.listFolders = asyncHandler(async (req, res) => {
  const { search, sort = "recent", page = 1, limit = 20 } = req.query;
  const companyId = req.company._id;
  const employerId = req.user._id;

  const query = { companyId, employerId };

  if (search) {
    query.name = { $regex: String(search).trim(), $options: "i" };
  }

  let sortQuery = { updatedAt: -1 };
  if (sort === "oldest") sortQuery = { createdAt: 1 };
  else if (sort === "name") sortQuery = { name: 1 };
  else if (sort === "candidates") sortQuery = { candidateCount: -1, updatedAt: -1 };
  else if (sort === "recent") sortQuery = { updatedAt: -1 };
  else if (sort === "created") sortQuery = { createdAt: -1 };

  const skip = (Math.max(1, Number(page)) - 1) * Math.min(Math.max(1, Number(limit)), 100);
  const pageLimit = Math.min(Math.max(1, Number(limit)), 100);

  const [folders, total] = await Promise.all([
    Folder.find(query).sort(sortQuery).skip(skip).limit(pageLimit).lean(),
    Folder.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: folders,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / pageLimit),
  });
});

// GET /folders/:id
exports.getFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({
    _id: req.params.id,
    companyId: req.company._id,
    employerId: req.user._id,
  }).lean();

  if (!folder) throw createHttpError(404, "Folder not found");

  const folderCandidates = await FolderCandidate.find({ folderId: folder._id })
    .sort({ createdAt: -1 })
    .lean();

  const rawCandidateIds = folderCandidates
    .map((fc) => fc.candidateId)
    .filter(Boolean);

  const [users, profiles] = await Promise.all([
    rawCandidateIds.length > 0
      ? User.find({ _id: { $in: rawCandidateIds } }).select("name email avatar").lean()
      : [],
    rawCandidateIds.length > 0
      ? CandidateProfile.find({
          $or: [
            { userId: { $in: rawCandidateIds } },
            { _id: { $in: rawCandidateIds } },
          ],
        })
          .select("userId headline summary currentTitle currentCompany totalExperience currentCity skills expectedSalary noticePeriod education resume profilePic publicShareId currentSalary preferredLocations")
          .lean()
      : [],
  ]);

  const userMap = {};
  for (const u of users) userMap[String(u._id)] = u;

  const profileByUserId = {};
  const profileById = {};
  for (const p of profiles) {
    profileByUserId[String(p.userId)] = p;
    profileById[String(p._id)] = p;
  }

  const enriched = folderCandidates.map((fc) => {
    const rawId = fc.candidateId;
    const rawIdStr = String(rawId || "");
    const user = userMap[rawIdStr] || {};
    const profile = profileByUserId[rawIdStr] || profileById[rawIdStr] || {};

    return {
      id: rawIdStr,
      folderCandidateId: String(fc._id),
      userId: String(user._id || profile.userId || rawIdStr),
      name: user.name || profile.name || "",
      email: user.email || "",
      avatar: user.avatar || profile.avatar || "",
      profilePic: profile.profilePic || "",
      headline: profile.headline || "",
      summary: profile.summary || "",
      currentTitle: profile.currentTitle || "",
      currentCompany: profile.currentCompany || "",
      totalExperience: profile.totalExperience || "",
      currentCity: profile.currentCity || "",
      skills: profile.skills || [],
      expectedSalary: profile.expectedSalary || "",
      currentSalary: profile.currentSalary || "",
      noticePeriod: profile.noticePeriod || "",
      education: profile.education || "",
      certifications: profile.certifications || [],
      resume: profile.resume || null,
      publicShareId: profile.publicShareId || "",
      preferredLocations: profile.preferredLocations || [],
      notes: fc.notes || "",
      tags: fc.tags || [],
      addedAt: fc.createdAt,
    };
  });

  res.json({
    success: true,
    data: { folder, candidates: enriched },
  });
});

// POST /folders
exports.createFolder = asyncHandler(async (req, res) => {
  const { name, description, icon, color, isPublic, sharedWith } = req.body;
  const companyId = req.company._id;
  const employerId = req.user._id;

  if (!name || !String(name).trim()) {
    throw createHttpError(400, "Folder name is required");
  }

  const trimmedName = String(name).trim();
  const slug = slugify(trimmedName);

  const existing = await Folder.findOne({ companyId, employerId, name: trimmedName });
  if (existing) {
    throw createHttpError(409, "A folder with this name already exists");
  }

  const folder = await Folder.create({
    employerId,
    companyId,
    name: trimmedName,
    slug,
    description: String(description || "").trim(),
    icon: icon || "folder",
    color: color || "#002366",
    isPublic: Boolean(isPublic),
    sharedWith: Array.isArray(sharedWith) ? sharedWith : (sharedWith ? [sharedWith] : []),
    createdBy: req.user.name || req.user.email || "Unknown",
    lastActivityAt: new Date(),
  });

  // Log recruiter activity (fire & forget)
  activityService.fireAndForget({
    companyId,
    recruiter: req.user,
    action: "FOLDER_CREATED",
    text: `Created folder **${trimmedName}**`,
    metadata: { folderId: folder._id, folderName: trimmedName },
  });

  res.status(201).json({ success: true, data: folder });
});

// PATCH /folders/:id
exports.updateFolder = asyncHandler(async (req, res) => {
  const { name, description, icon, color, isPublic, sharedWith } = req.body;
  const folder = await Folder.findOne({
    _id: req.params.id,
    companyId: req.company._id,
    employerId: req.user._id,
  });

  if (!folder) throw createHttpError(404, "Folder not found");

  if (name && String(name).trim()) {
    const trimmedName = String(name).trim();
    const dup = await Folder.findOne({
      _id: { $ne: folder._id },
      companyId: req.company._id,
      employerId: req.user._id,
      name: trimmedName,
    });
    if (dup) throw createHttpError(409, "A folder with this name already exists");
    folder.name = trimmedName;
    folder.slug = slugify(trimmedName);
  }

  if (description !== undefined) folder.description = String(description).trim();
  if (icon !== undefined) folder.icon = icon;
  if (color !== undefined) folder.color = color;
  if (isPublic !== undefined) folder.isPublic = Boolean(isPublic);
  if (sharedWith !== undefined) {
    folder.sharedWith = Array.isArray(sharedWith) ? sharedWith : [sharedWith];
  }

  await folder.save();

  res.json({ success: true, data: folder });
});

// DELETE /folders/:id
exports.deleteFolder = asyncHandler(async (req, res) => {
  const folder = await Folder.findOneAndDelete({
    _id: req.params.id,
    companyId: req.company._id,
    employerId: req.user._id,
  });

  if (!folder) throw createHttpError(404, "Folder not found");

  await FolderCandidate.deleteMany({ folderId: folder._id });

  res.json({ success: true, message: "Folder deleted" });
});

// POST /folders/:id/candidates
exports.addCandidate = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({
    _id: req.params.id,
    companyId: req.company._id,
    employerId: req.user._id,
  });

  if (!folder) throw createHttpError(404, "Folder not found");

  const { candidateId } = req.body;
  if (!candidateId) throw createHttpError(400, "candidateId is required");

  const existing = await FolderCandidate.findOne({ folderId: folder._id, candidateId });
  if (existing) {
    return res.json({ success: true, message: "Candidate already in folder" });
  }

  await FolderCandidate.create({
    folderId: folder._id,
    candidateId,
    addedBy: req.user._id,
  });

  folder.candidateCount = await FolderCandidate.countDocuments({ folderId: folder._id });
  folder.lastActivityAt = new Date();
  await folder.save();

  // Log recruiter activity (fire & forget)
  activityService.fireAndForget(() =>
    activityService.logForCandidate({
      companyId: req.company._id,
      recruiter: req.user,
      candidateId,
      action: "CANDIDATE_ADDED",
      text: `Added **{{candidateName}}** to folder **${folder.name}**`,
    }),
  );

  res.status(201).json({ success: true, message: "Candidate added to folder" });
});

// DELETE /folders/:id/candidates/:candidateId
exports.removeCandidate = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({
    _id: req.params.id,
    companyId: req.company._id,
    employerId: req.user._id,
  });

  if (!folder) throw createHttpError(404, "Folder not found");

  await FolderCandidate.findOneAndDelete({
    folderId: folder._id,
    candidateId: req.params.candidateId,
  });

  folder.candidateCount = await FolderCandidate.countDocuments({ folderId: folder._id });
  folder.lastActivityAt = new Date();
  await folder.save();

  res.json({ success: true, message: "Candidate removed from folder" });
});

// PATCH /folders/:id/candidates/:candidateId
exports.updateCandidate = asyncHandler(async (req, res) => {
  const { notes, tags } = req.body;

  const fc = await FolderCandidate.findOne({
    folderId: req.params.id,
    candidateId: req.params.candidateId,
  });

  if (!fc) throw createHttpError(404, "Folder candidate not found");

  if (notes !== undefined) fc.notes = String(notes).trim();
  if (tags !== undefined) fc.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];

  await fc.save();

  res.json({ success: true, data: fc });
});

// DELETE /folders/:id/candidates (bulk)
exports.bulkRemoveCandidates = asyncHandler(async (req, res) => {
  const { candidateIds } = req.body;
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
    throw createHttpError(400, "candidateIds array is required");
  }

  const folder = await Folder.findOne({
    _id: req.params.id,
    companyId: req.company._id,
    employerId: req.user._id,
  });

  if (!folder) throw createHttpError(404, "Folder not found");

  await FolderCandidate.deleteMany({
    folderId: folder._id,
    candidateId: { $in: candidateIds },
  });

  folder.candidateCount = await FolderCandidate.countDocuments({ folderId: folder._id });
  folder.lastActivityAt = new Date();
  await folder.save();

  res.json({ success: true, message: "Candidates removed" });
});

// POST /folders/candidates/move (bulk move across folders)
exports.moveCandidates = asyncHandler(async (req, res) => {
  const { fromFolderId, toFolderId, candidateIds } = req.body;

  if (!fromFolderId || !toFolderId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    throw createHttpError(400, "fromFolderId, toFolderId, and candidateIds are required");
  }

  const [fromFolder, toFolder] = await Promise.all([
    Folder.findOne({ _id: fromFolderId, companyId: req.company._id, employerId: req.user._id }),
    Folder.findOne({ _id: toFolderId, companyId: req.company._id, employerId: req.user._id }),
  ]);

  if (!fromFolder) throw createHttpError(404, "Source folder not found");
  if (!toFolder) throw createHttpError(404, "Target folder not found");

  for (const candidateId of candidateIds) {
    const existing = await FolderCandidate.findOne({ folderId: toFolderId, candidateId });
    if (existing) continue;

    const fc = await FolderCandidate.findOne({ folderId: fromFolderId, candidateId });
    if (!fc) continue;

    fc.folderId = toFolderId;
    await fc.save();
  }

  fromFolder.candidateCount = await FolderCandidate.countDocuments({ folderId: fromFolder._id });
  fromFolder.lastActivityAt = new Date();
  toFolder.candidateCount = await FolderCandidate.countDocuments({ folderId: toFolder._id });
  toFolder.lastActivityAt = new Date();
  await Promise.all([fromFolder.save(), toFolder.save()]);

  res.json({ success: true, message: "Candidates moved" });
});

// POST /folders/candidates/copy (bulk copy across folders)
exports.copyCandidates = asyncHandler(async (req, res) => {
  const { toFolderId, candidateIds } = req.body;

  if (!toFolderId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    throw createHttpError(400, "toFolderId and candidateIds are required");
  }

  const toFolder = await Folder.findOne({
    _id: toFolderId,
    companyId: req.company._id,
    employerId: req.user._id,
  });

  if (!toFolder) throw createHttpError(404, "Target folder not found");

  for (const candidateId of candidateIds) {
    const existing = await FolderCandidate.findOne({ folderId: toFolderId, candidateId });
    if (existing) continue;

    await FolderCandidate.create({
      folderId: toFolderId,
      candidateId,
      addedBy: req.user._id,
    });
  }

  toFolder.candidateCount = await FolderCandidate.countDocuments({ folderId: toFolder._id });
  toFolder.lastActivityAt = new Date();
  await toFolder.save();

  res.json({ success: true, message: "Candidates copied" });
});

// GET /folders/duplicate/:id
exports.duplicateFolder = asyncHandler(async (req, res) => {
  const source = await Folder.findOne({
    _id: req.params.id,
    companyId: req.company._id,
    employerId: req.user._id,
  });

  if (!source) throw createHttpError(404, "Folder not found");

  const newName = `${source.name} (Copy)`;
  const slug = slugify(newName);

  const folder = await Folder.create({
    employerId: req.user._id,
    companyId: req.company._id,
    name: newName,
    slug,
    description: source.description,
    icon: source.icon,
    color: source.color,
    isPublic: source.isPublic,
    createdBy: req.user.name || req.user.email || "Unknown",
    lastActivityAt: new Date(),
  });

  const fcs = await FolderCandidate.find({ folderId: source._id }).lean();
  if (fcs.length > 0) {
    const docs = fcs.map((fc) => ({
      folderId: folder._id,
      candidateId: fc.candidateId,
      addedBy: req.user._id,
      notes: fc.notes,
      tags: fc.tags,
    }));
    await FolderCandidate.insertMany(docs);
    folder.candidateCount = docs.length;
    await folder.save();
  }

  res.status(201).json({ success: true, data: folder });
});
