import React from 'react'

const Header = () => {
  return (
    <>
      <header
        style={{
          fontFamily: 'Marianne, arial, sans-serif',
          boxShadow: '0 8px 8px 0 rgb(0 0 0 / 10%)',
        }}
      >
        <div className="p-2 lg:p-0 text-lg">
          <div className="flex flex-col xl:mx-auto xl:max-w-7xl">
            <section className="flex flex-row px-2 pb-1 lg:p-4 items-center">
            </section>
          </div>

          {/* <div className="lg:border-0 lg:border-t lg:border-solid lg:border-slate-200 ">
            <section className="flex flex-col xl:mx-auto xl:max-w-7xl">
              <MainMenu />
            </section>
          </div> */}
        </div>
      </header>
    </>
  )
}

export default Header