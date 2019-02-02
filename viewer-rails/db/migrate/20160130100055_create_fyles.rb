class CreateFyles < ActiveRecord::Migration
  def change
    create_table :files do |t|
      t.string :md5
      t.string :path
      t.string :name

      t.timestamps null: false
    end
  end
end
