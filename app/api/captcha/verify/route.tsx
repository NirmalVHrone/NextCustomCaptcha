import { verifyCaptcha } from "@/lib/captcha-store"

export async function POST(req: Request) {
  const { captchaId, selectedCells } = await req.json()

  const success = verifyCaptcha(captchaId, selectedCells || [])

  return Response.json({ success })
}
