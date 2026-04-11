import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().optional(),
  inquiryType: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

const VALID_EVENT_TYPES = new Set([
  "Practice / Workout",
  "League",
  "Tournament",
  "Birthday Party",
  "Corporate / Private Event",
  "Youth Camp or Clinic",
  "Film Session",
  "Combine / Tryout",
  "Other",
]);

export const bookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  organization: z.string().optional(),
  eventType: z
    .string()
    .min(1, "Event type is required")
    .refine((v) => VALID_EVENT_TYPES.has(v), "Invalid event type."),
  sport: z.string().optional(),
  preferredDate: z
    .string()
    .min(1, "Preferred date is required")
    .refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(val) >= today;
    }, "Preferred date must be today or in the future."),
  alternateDate: z.string().optional(),
  startTime: z.string().optional(),
  duration: z.string().optional(),
  courts: z.string().optional(),
  groupSize: z.string().optional(),
  recurring: z.string().optional(),
  notes: z.string().optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  history: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .optional(),
  sessionId: z.string().optional(),
});

export const subscribeSchema = z.object({
  email: z.string().email("A valid email is required"),
});
