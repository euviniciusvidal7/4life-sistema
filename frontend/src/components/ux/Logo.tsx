import Link from 'next/link'

export default function Logo({ href = '/admin/overview' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 select-none">
      {/* Exiba a imagem correta conforme o tema */}
      <img src="/logo-dark.png" alt="4Life" className="hidden dark:block h-7 w-auto" />
      <img src="/logo-light.png" alt="4Life" className="block dark:hidden h-7 w-auto" />
      <span className="sr-only">4Life</span>
    </Link>
  )
}


