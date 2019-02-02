class FilesController < ApplicationController
  def index
    @files = Fyle.all
  end

  def show
    @file = Fyle.find(params[:id])
  end

  def new
  end

  def create
    @file = Fyle.new(file_params)

    @file.save
    redirect_to file_path(@file)
  end
private
  def file_params
    params.require(:file).permit(:md5, :path, :name)
  end
end
